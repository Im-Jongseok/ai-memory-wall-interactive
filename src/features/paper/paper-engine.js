import { assetUrl } from '../../app/assets';

/** Image/camera rendering stays outside React's render loop. DOM is scoped to one stage. */
export function createPaperEngine(stage, definition, { onNavigate, onError, onSettled }) {
  const $ = (id) => (id === stage.id ? stage : stage.querySelector(`#${id}`));
  const paper = $('paper'),
    sourceColumn = stage.parentElement;
  const scenes = definition.scenes;
  const paperW = 1000,
    paperH = (paperW * definition.pageSize.height) / definition.pageSize.width;
  paper.style.height = `${paperH}px`;
  let currentScene = scenes.find((s) => s.kind === 'paper');
  const scene = () => currentScene;
  const pageInfo = (id) => definition.pages.find((p) => p.id === id);
  const formatPage = (id) => pageInfo(id).printedPage;
  const state = {
    page: null,
    overview: false,
    manual: false,
    camera: { x: 0, y: 0, s: 1 },
    freePage: null,
    renderToken: 0,
    dragging: null,
  };
  const activePage = () => state.freePage ?? scene().page;
  const isPaper = () => currentScene.kind === 'paper';
  const go = (id) => onNavigate(id);
  const toast = (text) => onError(text);
  let cameraMotion, pageTransition;
  const controller = new AbortController();
  const listen = (element, name, handler, options = {}) =>
    element.addEventListener(name, handler, { ...options, signal: controller.signal });
  function fitCamera(roi = [0, 0, 1, 1], maxScale = Infinity) {
    const w = stage.clientWidth,
      h = stage.clientHeight;
    const pad = w < 450 ? 18 : 32,
      rw = (roi[2] - roi[0]) * paperW,
      rh = (roi[3] - roi[1]) * paperH;
    const s = Math.min((w - pad * 2) / rw, (h - pad * 2) / rh, maxScale);
    return {
      s,
      x: (w - rw * s) / 2 - roi[0] * paperW * s,
      y: (h - rh * s) / 2 - roi[1] * paperH * s,
    };
  }
  function textCamera(roi, maxScale) {
    const w = stage.clientWidth,
      h = stage.clientHeight,
      pad = w < 450 ? 18 : 32;
    const scale = Math.min(w / paperW, maxScale);
    const bottom = roi[3] * paperH * scale;
    const y = Math.max(Math.min(0, h - paperH * scale), Math.min(0, h - pad - bottom));
    return { s: scale, x: (w - paperW * scale) / 2, y };
  }
  function transitionCamera() {
    const camera = textCamera([0, 0, 1, 0], 1.25),
      h = stage.clientHeight;
    const y = h / 2 - ((h / 2 - state.camera.y) * camera.s) / state.camera.s;
    camera.y = Math.max(Math.min(0, h - paperH * camera.s), Math.min(0, y));
    return camera;
  }
  function stopCameraMotion() {
    if (!cameraMotion) return;
    const current = new DOMMatrix(getComputedStyle(paper).transform);
    cameraMotion.cancel();
    cameraMotion = null;
    applyCamera({ x: current.e, y: current.f, s: current.a });
    stage.classList.remove('switching');
  }
  async function moveCamera(camera, duration) {
    const from = getComputedStyle(paper).transform;
    stage.classList.add('switching');
    applyCamera(camera);
    const motion = paper.animate([{ transform: from }, { transform: paper.style.transform }], {
      duration,
      easing: 'cubic-bezier(.22,.72,.16,1)',
    });
    cameraMotion = motion;
    try {
      await motion.finished;
    } catch {}
    if (cameraMotion === motion) {
      cameraMotion = null;
      motion.cancel();
    }
  }
  function stopPageTransition() {
    if (!pageTransition) return;
    pageTransition.motion.cancel();
    pageTransition.layer.remove();
    pageTransition = null;
  }
  function preserveOutgoingPage() {
    const rect = stage.getBoundingClientRect(),
      layer = stage.cloneNode(true);
    layer.classList.add('page-transition-snapshot', 'switching');
    layer.setAttribute('aria-hidden', 'true');
    layer.inert = true;
    for (const el of [layer, ...layer.querySelectorAll('[id],[tabindex]')]) {
      el.removeAttribute('id');
      el.removeAttribute('tabindex');
    }
    Object.assign(layer.style, {
      position: 'fixed',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      aspectRatio: 'auto',
      margin: '0',
      background: 'var(--bg)',
      pointerEvents: 'none',
      zIndex: '10',
    });
    layer.querySelector('.paper').style.transform = getComputedStyle(paper).transform;
    layer.querySelector('.focus-image').style.clipPath = getComputedStyle(
      $('focus-image'),
    ).clipPath;
    layer.querySelector('.context-image').style.filter = getComputedStyle($('paper-image')).filter;
    const ringStyle = getComputedStyle($('focus-ring'));
    Object.assign(layer.querySelector('.focus-ring').style, {
      left: ringStyle.left,
      top: ringStyle.top,
      width: ringStyle.width,
      height: ringStyle.height,
    });
    document.body.append(layer);
    const motion = layer.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 220,
      easing: 'ease-out',
    });
    const transition = { layer, motion };
    pageTransition = transition;
    motion.finished
      .catch(() => {})
      .finally(() => {
        layer.remove();
        if (pageTransition === transition) pageTransition = null;
      });
  }
  function applyCamera(camera, manual = false) {
    state.camera = camera;
    state.manual = manual;
    stage.classList.toggle('manual', manual);
    paper.style.transform = `translate(${camera.x}px,${camera.y}px) scale(${camera.s})`;
    paper.style.setProperty('--context-blur', `${Math.max(0.825, Math.min(8, 1.8 / camera.s))}px`);
    paper.style.setProperty('--emphasis-box-width', `${1.7 / camera.s}px`);
    paper.style.setProperty('--emphasis-line-width', `${2 / camera.s}px`);
  }
  function targetROI() {
    if (state.freePage || state.overview || !scene().roi) return [0, 0, 1, 1];
    return scene().roi;
  }
  function renderEmphasis(roi) {
    const layer = $('key-emphasis');
    layer.replaceChildren();
    const marks = roi ? scene().emphasis || [] : [];
    layer.toggleAttribute('hidden', !marks.length);
    layer.setAttribute('viewBox', `0 0 ${paperW} ${paperH}`);
    for (const mark of marks) {
      const [x0, y0, x1, y1] = mark.rect;
      const node = document.createElementNS(
        'http://www.w3.org/2000/svg',
        mark.kind === 'underline' ? 'line' : 'rect',
      );
      node.setAttribute('class', `emphasis-${mark.kind}`);
      node.setAttribute('vector-effect', 'non-scaling-stroke');
      if (mark.kind === 'underline') {
        node.setAttribute('x1', x0 * paperW);
        node.setAttribute('x2', x1 * paperW);
        node.setAttribute('y1', y1 * paperH + 1);
        node.setAttribute('y2', y1 * paperH + 1);
      } else {
        node.setAttribute('x', x0 * paperW);
        node.setAttribute('y', y0 * paperH);
        node.setAttribute('width', (x1 - x0) * paperW);
        node.setAttribute('height', (y1 - y0) * paperH);
        node.setAttribute('rx', '1');
      }
      layer.append(node);
    }
  }
  function setFocus(roi) {
    const focused = roi && roi.some((v, i) => v !== [0, 0, 1, 1][i]);
    paper.classList.toggle('focused', !!focused);
    renderEmphasis(focused ? roi : null);
    const r = focused ? roi : [0, 0, 1, 1];
    const [x0, y0, x1, y1] = r;
    $('focus-image').style.clipPath =
      `inset(${y0 * 100}% ${(1 - x1) * 100}% ${(1 - y1) * 100}% ${x0 * 100}%)`;
    const ring = $('focus-ring');
    ring.hidden = !focused;
    ring.style.cssText = `left:${x0 * 100}%;top:${y0 * 100}%;width:${(x1 - x0) * 100}%;height:${(y1 - y0) * 100}%`;
  }
  function fitScene(animate = true) {
    if (!isPaper() && !state.freePage) return;
    const roi = targetROI();
    state.manual = false;
    stage.classList.toggle('switching', !animate);
    setFocus(
      state.overview || state.freePage || scene().focus === false
        ? null
        : scene().highlight || scene().roi,
    );
    const maxScale = state.overview || state.freePage ? Infinity : (scene().maxScale ?? Infinity);
    if (scene().panTop !== undefined && !state.overview && !state.freePage) {
      const scale = Math.min(stage.clientWidth / paperW, maxScale);
      applyCamera({
        s: scale,
        x: (stage.clientWidth - paperW * scale) / 2,
        y: -scene().panTop * paperH * scale,
      });
    } else if (!state.overview && !state.freePage && scene().maxScale !== undefined)
      applyCamera(textCamera(roi, maxScale));
    else applyCamera(fitCamera(roi, maxScale));
    updateHotspots();
    if (!animate) requestAnimationFrame(() => stage.classList.remove('switching'));
  }
  function updateHotspots() {
    $('hotspots').hidden =
      state.manual || (!state.overview && (!!scene().roi || scene().panTop !== undefined));
  }
  function makeHotspots(page) {
    $('hotspots').replaceChildren();
    const candidates = scenes.filter(
      (s) => s.page === page && s.roi && s.kind === 'paper' && !s.opening,
    );
    candidates.forEach((s, i) => {
      const [x0, y0, x1, y1] = s.roi;
      const b = document.createElement('button');
      b.className = 'hotspot';
      b.style.cssText = `left:${x0 * 100}%;top:${y0 * 100}%;width:${(x1 - x0) * 100}%;height:${(y1 - y0) * 100}%`;
      const label = s.id.startsWith('fig')
        ? 'Fig. ' + s.id.slice(3).replace(/([0-9])([a-d])/, '$1($2)')
        : s.id === 'equation'
          ? '式 (1)'
          : s.id === 'footnote-c'
            ? '각주 c'
            : s.id === 'review-2'
              ? '각주 d'
              : s.label.split(' · ')[0];
      b.setAttribute('aria-label', `${label}: ${s.title.replace(/\n/g, ' ')}`);
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!state.dragging?.moved) go(s.id);
      });
      $('hotspots').append(b);
    });
  }
  async function renderPaper(token) {
    const s = scene(),
      page = activePage(),
      free = !!state.freePage;
    makeHotspots(page);
    const src = assetUrl(pageInfo(page).image);
    const changed = state.page !== page || $('paper-image').getAttribute('src') !== src;
    if (changed) {
      const incoming = new Image();
      incoming.src = src;
      const ready = incoming.decode().then(
        () => true,
        () => false,
      );
      const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches && !free;
      if (
        motion &&
        state.page !== null &&
        state.camera.s > Math.min(stage.clientWidth / paperW, 1.25) * 1.02
      ) {
        await moveCamera(transitionCamera(), 360);
        if (token !== state.renderToken) return;
      }
      const loaded = await ready;
      if (token !== state.renderToken) return;
      if (!loaded) {
        toast('원문 이미지를 불러오지 못했습니다. assets 폴더를 확인해 주세요.');
        return;
      }
      if (motion && state.page !== null) preserveOutgoingPage();
      sourceColumn.classList.toggle('page-pan', s.panTop !== undefined && !free);
      stage.classList.add('switching');
      const img = $('paper-image');
      img.src = src;
      $('focus-image').src = src;
      img.alt = `${definition.title} 원문 ${formatPage(page)}쪽`;
      state.page = page;
      paper.style.opacity = '1';
      if (motion && s.panTop === undefined) {
        setFocus(null);
        applyCamera(textCamera(s.roi || [0, 0, 1, 0], 1.25));
        await new Promise((resolve) => setTimeout(resolve, 160));
        if (token !== state.renderToken) return;
        stage.classList.remove('switching');
        void paper.offsetWidth;
        fitScene();
      } else fitScene(false);
    } else {
      sourceColumn.classList.toggle('page-pan', s.panTop !== undefined && !free);
      fitScene();
    }
    onSettled?.();
  }
  function zoom(factor, anchor) {
    if (!isPaper() && !state.freePage) return;
    const current = state.camera,
      full = fitCamera().s;
    const s = Math.max(full * 0.6, Math.min(full * 16, current.s * factor));
    const point = anchor || { x: stage.clientWidth / 2, y: stage.clientHeight / 2 };
    const x = point.x - ((point.x - current.x) * s) / current.s,
      y = point.y - ((point.y - current.y) * s) / current.s;
    setFocus(null);
    applyCamera({ x, y, s }, true);
    updateHotspots();
  }
  listen(
    stage,
    'wheel',
    (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const r = stage.getBoundingClientRect();
        zoom(Math.exp(-Math.max(-70, Math.min(70, e.deltaY)) * 0.007), {
          x: e.clientX - r.left,
          y: e.clientY - r.top,
        });
      } else {
        setFocus(null);
        applyCamera(
          { ...state.camera, x: state.camera.x - e.deltaX, y: state.camera.y - e.deltaY },
          true,
        );
        updateHotspots();
      }
    },
    { passive: false },
  );
  listen(stage, 'pointerdown', (e) => {
    if (e.button !== 0) return;
    state.dragging = {
      x: e.clientX,
      y: e.clientY,
      c: { ...state.camera },
      moved: false,
      target: e.target,
    };
  });
  listen(stage, 'pointermove', (e) => {
    const d = state.dragging;
    if (!d) return;
    const dx = e.clientX - d.x,
      dy = e.clientY - d.y;
    if (Math.hypot(dx, dy) > 5) d.moved = true;
    if (!d.moved) return;
    stage.classList.add('dragging');
    stage.setPointerCapture(e.pointerId);
    setFocus(null);
    applyCamera({ x: d.c.x + dx, y: d.c.y + dy, s: d.c.s }, true);
    updateHotspots();
  });
  function endDrag(e) {
    if (!state.dragging) return;
    const moved = state.dragging.moved;
    stage.classList.remove('dragging');
    if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
    if (moved) {
      const suppress = (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      stage.addEventListener('click', suppress, { capture: true, once: true });
      setTimeout(() => stage.removeEventListener('click', suppress, { capture: true }), 100);
    }
    setTimeout(() => (state.dragging = null), 0);
  }
  listen(stage, 'pointerup', endDrag);
  listen(stage, 'pointercancel', endDrag);
  listen(stage, 'dblclick', (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    zoom(1.8, { x: e.clientX - r.left, y: e.clientY - r.top });
  });

  return {
    render(nextScene, freePage = null) {
      stopCameraMotion();
      stopPageTransition();
      currentScene = nextScene;
      state.freePage = freePage;
      state.overview = freePage !== null;
      state.manual = false;
      const token = ++state.renderToken;
      void renderPaper(token);
    },
    suspend() {
      ++state.renderToken;
      stopCameraMotion();
      stopPageTransition();
      sourceColumn.classList.remove('page-pan');
    },
    toggleOverview() {
      state.overview = state.manual ? true : !state.overview;
      state.manual = false;
      fitScene();
    },
    zoom,
    fit() {
      fitScene();
    },
    resize() {
      if (!stage.hidden) fitScene(false);
    },
    dispose() {
      ++state.renderToken;
      controller.abort();
      stopCameraMotion();
      stopPageTransition();
      sourceColumn.classList.remove('page-pan');
    },
  };
}
