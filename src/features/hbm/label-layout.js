import { Vector3 } from 'three';

export const annotationWidth = (w) => (w < 520 ? 82 : Math.min(136, w * 0.17));

/** Labels follow their parts. Each leader is straight or has a single right-angle bend. */
export function layoutHbmLabels({
  root,
  view,
  camera,
  geometry: A,
  labels,
  selected,
  mode,
  effectLink,
  effectRing,
}) {
  const $ = (id) => root.querySelector(`#${id}`);
  const w = view.clientWidth,
    h = view.clientHeight,
    width = annotationWidth(w),
    height = 28;
  const snap = (n) => Math.floor(n) + 0.5;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const project = (a) => {
    const p = new Vector3(...a).project(camera);
    return { x: (p.x * 0.5 + 0.5) * w, y: (-p.y * 0.5 + 0.5) * h };
  };
  const path = (points) => {
    const a = points
      .map(([x, y]) => [snap(x), snap(y)])
      .filter((p, i, a) => !i || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
    if (
      a.length === 3 &&
      ((a[0][0] === a[1][0] && a[1][0] === a[2][0]) || (a[0][1] === a[1][1] && a[1][1] === a[2][1]))
    )
      a.splice(1, 1);
    return a.map((p) => p.join(',')).join(' ');
  };
  const anchors = Object.fromEntries(
    Object.entries(A.anchors).map(([key, a]) => [key, project(a)]),
  );
  const top = Math.min(
    ...[-1, 1].flatMap((x) => [-1, 1].map((z) => project([-2.45 + x * 1.675, 1.834, z * 1.75]).y)),
  );
  const gpuTop = Math.min(
    ...[-1, 1].flatMap((x) => [-1, 1].map((z) => project([2.45 + x * 2.2, -0.38, z * 2.05]).y)),
  );
  const placed = [];
  function place(key, left, cy, side) {
    left = clamp(left, 8, w - width - 8);
    cy = clamp(cy, 22, h - 22);
    // Move only the label that needs clearance; do not force every annotation into a shared row.
    for (let attempt = 0; attempt < 12; attempt++) {
      const conflict = placed.find(
        (r) =>
          left < r.left + width + 6 &&
          left + width + 6 > r.left &&
          Math.abs(cy - r.cy) < height + 8,
      );
      if (!conflict) break;
      cy = clamp(conflict.cy + height + 8, 22, h - 22);
    }
    const { button, line, dot } = labels.get(key),
      a = anchors[key];
    Object.assign(button.style, {
      left: `${snap(left)}px`,
      top: `${snap(cy - height / 2)}px`,
      width: `${width}px`,
    });
    let points;
    if (side === 'above' || side === 'below') {
      const endX = clamp(a.x, left + 10, left + width - 10),
        endY = cy + (side === 'below' ? -height / 2 : height / 2);
      points = [
        [a.x, a.y],
        [endX, a.y],
        [endX, endY],
      ];
    } else {
      const end = side === 'left' ? left + width : left;
      points = [
        [a.x, a.y],
        [a.x, cy],
        [end, cy],
      ];
    }
    line.setAttribute('points', path(points));
    line.classList.toggle('selected', key === selected);
    dot.setAttribute('cx', snap(a.x));
    dot.setAttribute('cy', snap(a.y));
    dot.setAttribute('fill', key === selected ? 'var(--highlight)' : 'var(--annotation-ink)');
    placed.push({ key, left, cy });
  }
  $('hbm-callouts').setAttribute('viewBox', `0 0 ${w} ${h}`);
  // Put the TSV caption below the package, with one straight vertical leader.
  const packageBottom = Math.max(
    ...[-1, 1].flatMap((x) => [-1, 1].map((z) => project([x * 5.4, -1.6, z * 3.05]).y)),
  );
  place('dram', 8, anchors.dram.y, 'left');
  place('bumps', 8, anchors.bumps.y, 'left');
  place('base', 8, anchors.base.y, 'left');
  place('phy', w - width - 8, gpuTop - 30, 'right');

  place('interposer', w - width - 8, anchors.interposer.y, 'right');
  place('substrate', w - width - 8, anchors.substrate.y, 'right');
  const baseLabel = placed.find((item) => item.key === 'base');
  place(
    'tsv',
    anchors.tsv.x - width * 0.5,
    Math.max(packageBottom + 42, baseLabel.cy + height + 12),
    'below',
  );
  const gpuLabel = $('hbm-gpu-label'),
    gpuCenter = project([2.8, -0.38, 0]);
  gpuLabel.style.left = `${clamp(gpuCenter.x, width / 2 + 8, w - width / 2 - 8)}px`;
  gpuLabel.style.top = `${clamp(gpuTop - 76, 12, h - 55)}px`;
  const stack = $('hbm-stack-label'),
    p = project([-2.45, 2.25, 0]);
  stack.style.left = `${clamp(p.x, width / 2 + 8, w - width / 2 - 8)}px`;
  stack.style.top = `${clamp(top - 110, 8, h - 50)}px`;
  const effect = ['wiring', 'signal', 'power'].includes(mode);
  effectLink.style.display = effect ? '' : 'none';
  effectRing.style.display = effect ? '' : 'none';
  if (effect) {
    const a = project(mode === 'wiring' ? [-0.2, -1.002, 2.45] : [0.59, -0.35, 1.42]);
    const box = $('hbm-effect').getBoundingClientRect(),
      rect = view.getBoundingClientRect();
    const x = clamp(a.x, box.left - rect.left + 12, box.right - rect.left - 12),
      y = box.bottom - rect.top;
    effectLink.setAttribute(
      'points',
      path([
        [a.x, a.y],
        [x, a.y],
        [x, y],
      ]),
    );
    effectRing.setAttribute('cx', snap(a.x));
    effectRing.setAttribute('cy', snap(a.y));
    effectLink.setAttribute('stroke', 'var(--highlight)');
    effectRing.setAttribute('stroke', 'var(--highlight)');
  }
}
