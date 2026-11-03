import { HIGHLIGHT } from './palette';

/** Ordered teaching steps and diagrams; no camera or GPU state. */
export function createHbmExplanation(root, steps, onSelect) {
  const $ = (id) => root.querySelector(`#${id}`);
  const svgNS = 'http://www.w3.org/2000/svg',
    issueModes = ['wiring', 'signal', 'power'];
  const fmt = (n) => `${Number(n.toFixed(2))}×`;
  function prepare(mode, sceneMode) {
    const issue = sceneMode === 'sequence';
    $('hbm-problems').hidden = !issue;
    $('hbm-basics').hidden = !issue;
    $('hbm-issue-heading').hidden = !issue;
    root.dataset.hbmMode = mode;
    $('hbm-effect').hidden = !issue || !issueModes.includes(mode);
    for (const item of root.querySelectorAll('[data-hbm-step]')) {
      const current = item.dataset.mode === mode;
      item.classList.toggle('current', current);
      const button = item.matches('button') ? item : item.querySelector('button');
      button.setAttribute('aria-current', current ? 'step' : 'false');
      const description = item.querySelector('.hbm-problem-description');
      if (description) description.hidden = false;
    }
    const titles = {
      wiring: '연결부 확대 · 통로 수',
      signal: 'PHY · 비트 판별 간격',
      power: '전송 회로 · 전력 부담',
    };
    $('hbm-effect-title').textContent = titles[mode] || '';
    $('hbm-effect-caption').textContent =
      mode === 'wiring'
        ? '추가 핀·배선·송수신 회로가 필요'
        : mode === 'signal'
          ? '같은 시간에 더 많은 비트 → 더 짧은 판별 간격'
          : '비트당 전송 에너지가 같다는 가정';
    const svg = $('hbm-effect-graphic');
    svg.replaceChildren();
    const add = (tag, attrs, text) => {
      const el = document.createElementNS(svgNS, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      if (text) el.textContent = text;
      svg.append(el);
      return el;
    };
    if (mode === 'wiring') {
      add('text', { x: 4, y: 18, fill: '#63808b', 'font-size': 12 }, '기준 8개 → 16개 연결로 확대');
      for (let i = 0; i < 16; i++) {
        const y = 30 + i * 5.6;
        add('line', {
          x1: 20,
          y1: y,
          x2: 240,
          y2: y,
          stroke: i % 2 ? HIGHLIGHT.stroke : HIGHLIGHT.neutral,
          'stroke-width': 2,
          'data-extra': i % 2 ? 'true' : 'false',
        });
        add('rect', {
          x: 6,
          y: y - 2,
          width: 8,
          height: 4,
          fill: i % 2 ? HIGHLIGHT.stroke : HIGHLIGHT.neutral,
          'data-extra': i % 2 ? 'true' : 'false',
        });
      }
    } else if (mode === 'signal') {
      add('text', { x: 4, y: 15, fill: '#6b818a', 'font-size': 12 }, '느린 전송');
      add('path', { id: 'hbm-wave-slow', fill: 'none', stroke: '#8ba6ad', 'stroke-width': 2 });
      add('text', { x: 4, y: 78, fill: HIGHLIGHT.ink, 'font-size': 12 }, '빠른 전송');
      add('path', {
        id: 'hbm-wave-fast',
        fill: 'none',
        stroke: HIGHLIGHT.stroke,
        'stroke-width': 2,
      });
      add('line', {
        x1: 190,
        y1: 83,
        x2: 190,
        y2: 128,
        stroke: HIGHLIGHT.stroke,
        'stroke-dasharray': '3 3',
      });
    } else if (mode === 'power') {
      add('text', { x: 4, y: 19, fill: '#627984', 'font-size': 12 }, '기준');
      add('rect', { x: 4, y: 28, width: 57, height: 20, rx: 3, fill: '#adc5cd' });
      add('text', { x: 68, y: 43, fill: '#627984', 'font-size': 14 }, '1×');
      add('text', { x: 4, y: 78, fill: HIGHLIGHT.ink, 'font-size': 12 }, '전송량 증가 후');
      add('rect', {
        id: 'hbm-power-bar',
        x: 4,
        y: 87,
        width: 57,
        height: 20,
        rx: 3,
        fill: HIGHLIGHT.stroke,
      });
      add(
        'text',
        { id: 'hbm-power-value', x: 68, y: 102, fill: HIGHLIGHT.ink, 'font-size': 14 },
        '1×',
      );
    }
  }
  function update(mode, progress, elapsed) {
    if (!issueModes.includes(mode)) return;
    if (mode === 'wiring') {
      for (const el of $('hbm-effect-graphic').querySelectorAll('[data-extra=true]'))
        el.setAttribute('opacity', progress);
    } else if (mode === 'signal') {
      const wave = (fast) => {
        let path = '';
        const period = fast ? 48 / (1 + progress) : 48;
        for (let x = 8; x <= 250; x += 2) {
          const phase = ((x - 8) / period) % 1,
            level = phase < 0.5 ? 0 : 1,
            noise = fast ? Math.sin(x * 0.63 + elapsed * 3) * 2.4 * progress : 0;
          const y = (fast ? 94 : 31) + level * 22 + noise;
          path += (x === 8 ? 'M' : 'L') + x + ',' + y.toFixed(2);
        }
        return path;
      };
      $('hbm-wave-slow').setAttribute('d', wave(false));
      $('hbm-wave-fast').setAttribute('d', wave(true));
    } else {
      const value = 1 + 3 * progress;
      $('hbm-power-bar').setAttribute('width', 57 * value);
      $('hbm-power-value').setAttribute('x', Math.min(240, 68 + 57 * (value - 1)));
      $('hbm-power-value').textContent = fmt(value);
    }
  }
  for (const step of steps) {
    if (step.mode === 'structure') continue;
    const issue = issueModes.includes(step.mode),
      button = document.createElement('button');
    button.type = 'button';
    button.className = issue ? 'hbm-problem-button' : 'hbm-basic-button';
    button.setAttribute(
      'aria-label',
      `${step.title}. ${step.body}. ${issue ? '문제 상황 재현' : '설명 보기'}`,
    );
    const heading = document.createElement('span');
    heading.className = 'hbm-step-title';
    const number = document.createElement('span'),
      title = document.createElement('strong');
    number.textContent = step.number;
    title.textContent = step.title;
    if (issue) heading.append(number, title);
    else {
      heading.className = 'hbm-data-route';
      const nodes = step.title.split(' → ');
      nodes.forEach((name, index) => {
        if (index) {
          const arrow = document.createElement('span');
          arrow.className = 'hbm-route-arrow';
          arrow.textContent = '→';
          arrow.setAttribute('aria-hidden', 'true');
          heading.append(arrow);
        }
        const node = document.createElement('strong');
        node.textContent = name;
        heading.append(node);
      });
    }
    const description = document.createElement('span');
    description.className = issue ? 'hbm-problem-description' : 'hbm-basic-description';
    description.textContent = step.body;
    button.append(heading, description);
    button.addEventListener('click', () => onSelect(step.mode));
    const item = issue ? document.createElement('li') : button;
    item.dataset.mode = step.mode;
    item.dataset.hbmStep = '';
    if (issue) {
      item.append(button);
      $('hbm-problems').append(item);
    } else $('hbm-basics').append(button);
  }
  return { prepare, update };
}
