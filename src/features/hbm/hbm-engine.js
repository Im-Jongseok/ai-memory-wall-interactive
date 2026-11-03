import * as T from 'three';
import { HIGHLIGHT } from './palette';
import { HBM_PARTS as parts } from './parts';
import { buildHbmModel } from './model';
import { createHbmExplanation } from './explanation';
import { annotationWidth, layoutHbmLabels } from './label-layout';

/** Each mount owns its renderer, listeners, labels and GPU resources. */
export function createHbmEngine(root, { geometry: A, steps, onMode, onReady }) {
  let ready = false;
  function signalReady() {
    if (!ready) {
      ready = true;
      onReady?.();
    }
  }
  const $ = (id) => root.querySelector(`#${id}`);
  const controller = new AbortController();
  const observers = [];
  const listen = (element, name, handler, options = {}) =>
    element.addEventListener(name, handler, { ...options, signal: controller.signal });
  const view = $('hbm-view');
  let renderer,
    world,
    camera,
    model,
    raf = 0,
    active = false,
    initialized = false,
    failed = false,
    mode = 'structure',
    sceneMode = 'structure',
    selected = 'dram';
  const exploded = false,
    explode = 0,
    flow = true;
  let width = 1,
    speed = 1,
    theta = 0.55,
    phi = 0.98,
    zoom = 1,
    drag = null,
    last = 0,
    elapsed = 0,
    front = false,
    viewMotion = null,
    modeStarted = 0,
    progress = 0;
  let objects = [],
    tsvs = [],
    traces = [],
    lines = [],
    dots = [],
    heat = [],
    pads = [],
    wisps = [],
    renderedFrames = 0;
  const raycaster = T ? new T.Raycaster() : null,
    pointer = T ? new T.Vector2() : null;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let matColors = new Map();
  const labels = new Map(),
    svgNS = 'http://www.w3.org/2000/svg';
  const issueModes = ['wiring', 'signal', 'power'];
  const sequenceModes = steps.map((step) => step.mode);
  let onscreen = true,
    suspendedAt = 0;
  function requestFrame() {
    if (active && !failed && onscreen && !document.hidden && !raf)
      raf = requestAnimationFrame(animate);
  }
  function suspend() {
    if (!active) return;
    if (!suspendedAt) suspendedAt = performance.now();
    cancelAnimationFrame(raf);
    raf = 0;
  }
  function resume() {
    if (!active || document.hidden || !onscreen) return;
    if (suspendedAt) {
      const gap = performance.now() - suspendedAt;
      modeStarted += gap;
      if (viewMotion) viewMotion.start += gap;
      suspendedAt = 0;
    }
    last = 0;
    requestFrame();
  }

  function makeModel() {
    ({ model, objects, tsvs, traces, pads, heat, wisps, matColors } = buildHbmModel(world, A));
    rebuildRoutes();
  }
  function pointsForLane(lane) {
    return A.lanes[width === 2 ? lane : lane * 2].route.map((p) => new T.Vector3(...p));
  }
  function rebuildRoutes() {
    for (const l of lines) {
      model.remove(l);
      l.geometry.dispose();
      l.material.dispose();
    }
    for (const d of dots) {
      model.remove(d);
      d.geometry.dispose();
      d.material.dispose();
    }
    lines = [];
    dots = [];
    const count = width === 2 ? 16 : 8;
    for (let i = 0; i < count; i++) {
      const line = new T.Line(
        new T.BufferGeometry().setFromPoints(pointsForLane(i)),
        new T.LineBasicMaterial({ color: 0xd7992b, transparent: true, opacity: 0.55 }),
      );
      model.add(line);
      lines.push(line);
      const dot = new T.Mesh(
        new T.BoxGeometry(0.045, 0.045, 0.09),
        new T.MeshBasicMaterial({ color: 0xf6b82f }),
      );
      dot.userData.phase = i / count;
      model.add(dot);
      dots.push(dot);
    }
  }
  function setSelected(part) {
    selected = part;
    const data = parts[part];
    for (const button of root.querySelectorAll('[data-part]'))
      button.setAttribute('aria-pressed', String(button.dataset.part === part));
    if (initialized && !failed) {
      for (const object of objects) {
        const m = object.material;
        if (!m?.isMeshStandardMaterial) continue;
        m.color.copy(matColors.get(m));
        m.emissive.setHex(object.userData.part === part ? HIGHLIGHT.model : 0x000000);
        m.emissiveIntensity = object.userData.part === part ? 0.22 : 0;
        m.transparent = false;
        m.opacity = 1;
        m.depthWrite = true;
      }
    }
    requestFrame();
  }
  function startFrontMotion() {
    front = true;
    if (reduced()) {
      theta = 0;
      phi = 1.14;
      viewMotion = null;
    } else
      viewMotion = {
        start: performance.now() + 650,
        duration: 1600,
        theta,
        phi,
        targetTheta: 0,
        targetPhi: 1.14,
      };
  }
  function prepareExplanation() {
    explanation.prepare(mode, sceneMode);
  }
  function updateEffect() {
    explanation.update(mode, progress, elapsed);
  }
  function resize() {
    if (!initialized || failed || !active) return;
    const w = Math.max(1, view.clientWidth),
      h = Math.max(1, view.clientHeight),
      aspect = w / h;
    const vertical = Math.max(9.2, 17 / aspect);
    camera.left = (-vertical * aspect) / 2;
    camera.right = (vertical * aspect) / 2;
    camera.top = vertical / 2;
    camera.bottom = -vertical / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    requestFrame();
  }
  function updateLabels() {
    if (!active || failed) return;
    layoutHbmLabels({
      root,
      view,
      camera,
      geometry: A,
      labels,
      selected,
      mode,
      effectLink,
      effectRing,
    });
  }
  function animate(now) {
    raf = 0;
    if (!active || !onscreen || document.hidden) return;
    const dt = Math.max(0, Math.min(0.05, (now - (last || now)) / 1000));
    last = now;
    if (!reduced()) elapsed += dt;
    progress = reduced() ? 1 : Math.max(0, Math.min(1, (now - modeStarted - 650) / 1400));
    progress = progress * progress * (3 - 2 * progress);
    speed = mode === 'signal' ? 1 + progress : mode === 'power' ? 2 : 1;
    if (viewMotion) {
      const t = Math.max(0, Math.min(1, (now - viewMotion.start) / viewMotion.duration)),
        ease = t * t * (3 - 2 * t);
      theta = viewMotion.theta + (viewMotion.targetTheta - viewMotion.theta) * ease;
      phi = viewMotion.phi + (viewMotion.targetPhi - viewMotion.phi) * ease;
      if (t === 1) viewMotion = null;
    }
    const laneVisible = (i) =>
      i % 2 === 0 ||
      (width === 2 && (mode !== 'wiring' || Math.floor(i / 2) < Math.floor(progress * 8 + 0.001)));
    tsvs.forEach((t, i) => (t.visible = laneVisible(i)));
    traces.forEach((t, i) => {
      t.visible = laneVisible(i);
      t.material.color.setHex(i % 2 ? HIGHLIGHT.model : 0xbda568);
    });
    pads.forEach((t, i) => (t.visible = laneVisible(i)));
    for (let i = 0; i < lines.length; i++) {
      const points = pointsForLane(i),
        array = lines[i].geometry.attributes.position;
      for (let k = 0; k < points.length; k++)
        array.setXYZ(k, points[k].x, points[k].y, points[k].z);
      array.needsUpdate = true;
      lines[i].visible = flow && mode !== 'structure' && laneVisible(width === 2 ? i : i * 2);
      dots[i].visible = lines[i].visible;
      if (flow) {
        const u = ((elapsed * 0.22 * speed + dots[i].userData.phase) % 1) * (points.length - 1),
          j = Math.min(points.length - 2, Math.floor(u));
        dots[i].position.copy(points[j]).lerp(points[j + 1], u - j);
      }
    }
    const heatLevel = mode === 'power' ? progress * 0.33 : mode === 'signal' ? 0.05 : 0;
    for (const m of heat) m.material.opacity = heatLevel;
    for (const object of objects) {
      const m = object.material;
      if (!m?.isMeshStandardMaterial) continue;
      const warm = mode === 'power' && ['phy', 'base', 'bumps'].includes(object.userData.part);
      m.emissive.setHex(
        warm ? 0xed9748 : object.userData.part === selected ? HIGHLIGHT.model : 0x000000,
      );
      m.emissiveIntensity = warm
        ? progress * (0.2 + 0.05 * Math.sin(elapsed * 2))
        : object.userData.part === selected
          ? 0.15
          : 0;
    }
    wisps.forEach((wisp, i) => {
      wisp.visible = mode === 'power';
      wisp.material.opacity = progress * 0.52;
      const a = wisp.geometry.attributes.position;
      for (let k = 0; k < 24; k++) {
        const t = k / 23,
          x = i < 3 ? 0.6 + i * 0.3 : -1.2 - (i - 3) * 0.28,
          y = -0.1 + t * (1.2 + i * 0.09);
        a.setXYZ(
          k,
          x + Math.sin(t * 6 + elapsed * 2 + i) * 0.07,
          y,
          0.4 + Math.cos(t * 5 + elapsed + i) * 0.05,
        );
      }
      a.needsUpdate = true;
    });
    const targetPoint = new T.Vector3(0, 0.0, 0),
      radius = 16;
    camera.position.set(
      targetPoint.x + radius * Math.sin(phi) * Math.sin(theta),
      targetPoint.y + radius * Math.cos(phi),
      targetPoint.z + radius * Math.sin(phi) * Math.cos(theta),
    );
    camera.lookAt(targetPoint);
    const viewWidth = view.clientWidth,
      available = viewWidth - 2 * (annotationWidth(viewWidth) + 16);
    const packageWidth = 10.8 * Math.abs(Math.cos(theta)) + 6.1 * Math.abs(Math.sin(theta));
    const fitZoom = (available * (camera.right - camera.left)) / (viewWidth * packageWidth);
    camera.zoom = zoom * Math.min(0.96, fitZoom);
    camera.updateProjectionMatrix();
    renderer.render(world, camera);
    renderedFrames++;
    updateLabels();
    updateEffect();
    signalReady();
    if (!reduced()) requestFrame();
  }
  function startIssue(next) {
    mode = next;
    modeStarted = performance.now();
    progress = failed ? 1 : 0;
    width = issueModes.includes(mode) ? 2 : 1;
    if (initialized && !failed) rebuildRoutes();
    setSelected(
      mode === 'structure'
        ? 'dram'
        : mode === 'path'
          ? 'tsv'
          : mode === 'wiring'
            ? 'interposer'
            : 'phy',
    );
    if (mode === 'structure') {
      theta = 0.55;
      phi = 0.98;
      zoom = 1;
      startFrontMotion();
    }
    prepareExplanation();
    if (failed) updateEffect();
  }
  function showTooltip(key) {
    const data = parts[key],
      tip = $('hbm-tooltip'),
      button = labels.get(key).button;
    setSelected(key);
    tip.querySelector('strong').textContent = data.name;
    tip.querySelector('p').textContent = data.description;
    tip.hidden = false;
    button.setAttribute('aria-describedby', 'hbm-tooltip');
    const v = view.getBoundingClientRect(),
      b = button.getBoundingClientRect(),
      left = b.left - v.left;
    tip.style.width = `${Math.min(240, v.width - 24)}px`;
    tip.style.left = `${Math.max(8, Math.min(v.width - tip.offsetWidth - 8, left < v.width / 2 ? left + b.width + 8 : left - tip.offsetWidth - 8))}px`;
    tip.style.top = `${Math.max(8, Math.min(v.height - tip.offsetHeight - 8, b.top - v.top - 12))}px`;
  }
  function hideTooltip() {
    $('hbm-tooltip').hidden = true;
  }
  function hit(event) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      (-(event.clientY - r.top) / r.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(
      objects.filter((o) => o.visible),
      false,
    )[0]?.object.userData.part;
  }
  function showFallback() {
    $('hbm-fallback').hidden = false;
    for (const id of ['hbm-parts', 'hbm-stack-label', 'hbm-gpu-label', 'hbm-callouts'])
      $(id).hidden = true;
    if (renderer) renderer.domElement.hidden = true;
  }
  function init() {
    if (initialized) return;
    initialized = true;
    try {
      if (!T || !A) throw new Error('HBM geometry unavailable');
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.setClearColor(0xffffff, 1);
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      renderer.domElement.setAttribute(
        'aria-label',
        'HBM과 GPU의 3차원 구조. 드래그로 회전하고 휠로 확대합니다. 부품을 눌러 역할을 확인할 수 있습니다.',
      );
      renderer.domElement.setAttribute('role', 'img');
      renderer.domElement.tabIndex = 0;
      view.prepend(renderer.domElement);
      world = new T.Scene();
      camera = new T.OrthographicCamera(-8, 8, 6, -6, 0.1, 100);
      world.add(new T.HemisphereLight(0xf4f8fa, 0x9b9e9e, 2.5));
      const light = new T.DirectionalLight(0xffffff, 3.0);
      light.position.set(-3, 9, 5);
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      Object.assign(light.shadow.camera, {
        left: -9,
        right: 9,
        top: 9,
        bottom: -9,
        near: 0.5,
        far: 30,
      });
      light.shadow.bias = -0.001;
      world.add(light);
      const rim = new T.DirectionalLight(0xc8e6fa, 1.5);
      rim.position.set(5, 4, -5);
      world.add(rim);
      makeModel();
      const canvas = renderer.domElement;
      listen(canvas, 'pointerdown', (e) => {
        if (e.button !== 0) return;
        viewMotion = null;
        drag = { x: e.clientX, y: e.clientY, theta, phi, moved: false };
        canvas.setPointerCapture(e.pointerId);
      });
      listen(canvas, 'pointermove', (e) => {
        if (!drag) {
          canvas.style.cursor = hit(e) ? 'pointer' : 'grab';
          return;
        }
        const dx = e.clientX - drag.x,
          dy = e.clientY - drag.y;
        if (Math.hypot(dx, dy) > 5) drag.moved = true;
        if (drag.moved) {
          theta = drag.theta - dx * 0.006;
          phi = Math.max(0.35, Math.min(Math.PI / 2, drag.phi + dy * 0.006));
          front = false;
          canvas.style.cursor = 'grabbing';
          requestFrame();
        }
      });
      const end = (e) => {
        if (!drag) return;
        if (!drag.moved) {
          const part = hit(e);
          if (part) setSelected(part);
        }
        drag = null;
        if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
        canvas.style.cursor = 'grab';
      };
      listen(canvas, 'pointerup', end);
      listen(canvas, 'pointercancel', () => (drag = null));
      listen(
        canvas,
        'wheel',
        (e) => {
          e.preventDefault();
          zoom = Math.max(
            0.55,
            Math.min(1.65, zoom * Math.exp(-Math.max(-80, Math.min(80, e.deltaY)) * 0.002)),
          );
          requestFrame();
        },
        { passive: false },
      );
      listen(canvas, 'webglcontextlost', (e) => {
        e.preventDefault();
        failed = true;
        cancelAnimationFrame(raf);
        showFallback();
      });
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(view);
      observers.push(resizeObserver);
      const intersectionObserver = new IntersectionObserver((entries) => {
        onscreen = entries[0].isIntersecting;
        if (onscreen) resume();
        else suspend();
      });
      intersectionObserver.observe(view);
      observers.push(intersectionObserver);
    } catch (error) {
      failed = true;
      showFallback();
      console.warn('HBM 3D model unavailable:', error.message);
    }
  }
  for (const [key, data] of Object.entries(parts)) {
    const b = key === 'gpu' ? $('hbm-gpu-label') : document.createElement('button');
    b.type = 'button';
    b.dataset.part = key;
    b.setAttribute('aria-label', `${data.name}. ${data.description}`);
    b.setAttribute('aria-pressed', 'false');
    for (const [event, callback] of [
      ['click', () => showTooltip(key)],
      ['pointerenter', () => showTooltip(key)],
      ['pointerleave', hideTooltip],
      ['focus', () => showTooltip(key)],
      ['blur', hideTooltip],
    ])
      listen(b, event, callback);
    if (key !== 'gpu') {
      b.className = 'hbm-part-label';
      b.textContent = data.short;
      $('hbm-parts').append(b);
      const line = document.createElementNS(svgNS, 'polyline'),
        dot = document.createElementNS(svgNS, 'circle');
      line.setAttribute('class', 'hbm-leader');
      dot.setAttribute('r', '2.5');
      dot.setAttribute('fill', 'var(--annotation-ink)');
      $('hbm-callouts').append(line, dot);
      labels.set(key, { button: b, line, dot });
    } else labels.set(key, { button: b });
  }
  const effectLink = document.createElementNS(svgNS, 'polyline'),
    effectRing = document.createElementNS(svgNS, 'circle');
  effectLink.setAttribute('fill', 'none');
  effectLink.setAttribute('stroke-dasharray', '4 4');
  effectLink.setAttribute('stroke-width', '1');
  effectRing.setAttribute('r', '9');
  effectRing.setAttribute('fill', 'none');
  effectRing.setAttribute('stroke-width', '1.5');
  $('hbm-callouts').append(effectLink, effectRing);
  const explanation = createHbmExplanation(root, steps, (next) => {
    startIssue(next);
    onMode?.(next);
  });
  listen(document, 'visibilitychange', () => (document.hidden ? suspend() : resume()));
  const engine = {
    show(next) {
      const entering = !active,
        changed = sceneMode !== next;
      sceneMode = next;
      active = true;
      if (entering) {
        onscreen = true;
        suspendedAt = 0;
      }
      init();
      hideTooltip();
      if (changed || entering) {
        mode = next === 'sequence' ? (sequenceModes[0] ?? 'structure') : next;
        modeStarted = performance.now();
        width = issueModes.includes(mode) ? 2 : 1;
        if (!failed) rebuildRoutes();
        setSelected(
          mode === 'structure'
            ? 'dram'
            : mode === 'path'
              ? 'tsv'
              : mode === 'wiring'
                ? 'interposer'
                : 'phy',
        );
        if (entering || mode === 'structure') {
          theta = 0.55;
          phi = 0.98;
          zoom = 1;
          startFrontMotion();
        }
      }
      prepareExplanation();
      if (failed) {
        progress = 1;
        updateEffect();
        signalReady();
      }
      if (!failed) {
        resize();
        cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
        // A View Transition suspends rAF until its update callback settles.
        // Paint the initial model synchronously so readiness never waits on rAF.
        if (renderedFrames === 0) animate(performance.now());
        else requestFrame();
      }
    },
    select(next) {
      if (active && mode !== next) startIssue(next);
    },
    hide() {
      active = false;
      suspendedAt = 0;
      viewMotion = null;
      cancelAnimationFrame(raf);
      raf = 0;
      hideTooltip();
      $('hbm-problems').hidden = true;
      $('hbm-basics').hidden = true;
      $('hbm-issue-heading').hidden = true;
      $('hbm-effect').hidden = true;
    },
    resize,
    dispose() {
      engine.hide();
      controller.abort();
      observers.forEach((observer) => observer.disconnect());
      const geometries = new Set(),
        materials = new Set(),
        textures = new Set();
      world?.traverse((object) => {
        object.shadow?.dispose();
        if (object.geometry) geometries.add(object.geometry);
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material]) {
          if (!material) continue;
          materials.add(material);
          if (material.map) textures.add(material.map);
        }
      });
      geometries.forEach((g) => g.dispose());
      textures.forEach((t) => t.dispose());
      materials.forEach((m) => m.dispose());
      renderer?.dispose();
      renderer?.domElement.remove();
      $('hbm-parts').replaceChildren();
      $('hbm-callouts').replaceChildren();
      $('hbm-problems').replaceChildren();
      $('hbm-basics').replaceChildren();
      for (const id of ['hbm-parts', 'hbm-stack-label', 'hbm-gpu-label', 'hbm-callouts'])
        $(id).hidden = false;
      $('hbm-fallback').hidden = true;
    },
    status() {
      return {
        geometrySource: A?.source,
        anatomyParts: A?.solids.length,
        active,
        sceneMode,
        mode,
        selected,
        exploded,
        explode,
        flow,
        front,
        viewAnimating: !!viewMotion,
        progress,
        width,
        speed,
        bandwidth: width * speed,
        visibleLanes: tsvs.filter((t) => t.visible).length,
        heat: heatLevelForStatus(),
        manualPlayback: true,
        renderedFrames,
        failed,
        renderer: renderer ? 'Three.js WebGLRenderer' : null,
        revision: T?.REVISION,
        camera: { theta, phi, zoom },
      };
    },
  };
  function heatLevelForStatus() {
    return mode === 'power' ? progress : 0;
  }
  setSelected('dram');
  return engine;
}
