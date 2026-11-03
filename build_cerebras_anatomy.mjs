/** Anatomy Figure: one wafer-scale processor, not a literal floorplan.
 * Concept: dense connected tiles share local compute + SRAM; a selected tile exposes reuse.
 * Reference: user-supplied early WSE photograph; current product facts stay in slide content.
 * 56 schematic tile regions, one silicon body, four edge strips, one GPU size comparator.
 * Detail: chip surface grid, boundary pads, beveled corners, SRAM banks, core, router, contacts.
 * Geometry/paint/audit: wheresryan22/anatomy, MIT, 1482e8469b0a9e0d8cc18ea2740a01423d29ae80.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import * as k from './tools/anatomy/iso-kit.mjs';
import * as A from './tools/anatomy/audit.mjs';
const WIDTH = 760,
  HEIGHT = 550;
const WSE_AREA = 46225,
  REFERENCE_GPU_AREA = 815,
  SIDE = Math.sqrt(WSE_AREA);
const source = {
  name: 'Anatomy',
  commit: '1482e8469b0a9e0d8cc18ea2740a01423d29ae80',
  license: 'MIT',
};
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
const tint = (color, f) =>
  hex(
    [16, 8, 0].reduce(
      (acc, s) => acc + (Math.min(255, Math.round(((color >> s) & 255) * f)) << s),
      0,
    ),
  );
function material(color) {
  return `--anatomy-paper:${hex(color)};--anatomy-top:${tint(color, 1.09)};--anatomy-shade-0:${tint(color, 0.5)};--anatomy-shade-1:${tint(color, 0.64)};--anatomy-shade-2:${tint(color, 0.77)};--anatomy-shade-3:${tint(color, 0.9)};--anatomy-hi:${tint(color, 0.55)};--anatomy-mid:${tint(color, 0.64)};--anatomy-lo:${tint(color, 0.75)}`;
}
const pointBounds = (points) => ({
  x: Math.min(...points.map((p) => p[0])),
  y: Math.min(...points.map((p) => p[1])),
  right: Math.max(...points.map((p) => p[0])),
  bottom: Math.max(...points.map((p) => p[1])),
});
function build(mode) {
  const parts = [];
  const add = (name, plan, z, h, color, extra = {}) => {
    const part = { name, plan, z, h, color, ...extra };
    parts.push(part);
    return part;
  };
  const wafer = { x: -SIDE / 2, y: -SIDE / 2, w: SIDE, d: SIDE, r: 3.3 };
  const chamfer = (p) => [
    [p.x + 4, p.y],
    [p.x + p.w - 4, p.y],
    [p.x + p.w, p.y + 4],
    [p.x + p.w, p.y + p.d - 4],
    [p.x + p.w - 4, p.y + p.d],
    [p.x + 4, p.y + p.d],
    [p.x, p.y + p.d - 4],
    [p.x, p.y + 4],
  ];
  const body = add('wse-silicon', wafer, 0, 1.6, 0x9d692c, { ring: chamfer(wafer) });
  const tileW = 198 / 8,
    tileD = 198 / 7;
  for (let row = 0; row < 7; row++)
    for (let col = 0; col < 8; col++) {
      const light = col + row;
      const c = [0xb8863b, 0xc08d3d, 0xc79845, 0xd0a14c, 0xc18c37][light % 5];
      add(
        `tile-${row}-${col}`,
        {
          x: -99 + col * tileW + 0.25,
          y: -99 + row * tileD + 0.25,
          w: tileW - 0.5,
          d: tileD - 0.5,
          r: 0.18,
        },
        1.6,
        0.1,
        c,
        { tile: true, selected: row === 4 && col === 5 },
      );
    }
  // Surface edge strips meet the silicon; these are not an extra PCB or package layer.
  for (const [name, x, y, w, d] of [
    ['north', -103, -104, 206, 2],
    ['south', -103, 102, 206, 2],
    ['west', -104, -102, 2, 204],
    ['east', 102, -102, 2, 204],
  ])
    add('edge-' + name, { x, y, w, d, r: 0.25 }, 1.6, 0.12, 0x936332);
  let gpu;
  if (mode !== 'stack') {
    const size = Math.sqrt(REFERENCE_GPU_AREA);
    gpu = add('reference-gpu', { x: 154, y: 76, w: size, d: size, r: 0.6 }, 0, 1.6, 0x3c4a50);
    add('gpu-inset', { x: 156, y: 78, w: size - 4, d: size - 4, r: 0.2 }, 1.6, 0.1, 0x67757c, {
      gpuGrid: true,
    });
  }
  if (mode === 'stack') {
    // Visual separation reveals the connection; it is not a physical CS-6 stack height.
    for (const x of [-72, 72])
      for (const y of [-72, 72])
        add(
          `dram-link-${x}-${y}`,
          { x: x - 1.5, y: y - 1.5, w: 3, d: 3, r: 0.1 },
          1.7,
          48.3,
          0xbfa061,
        );
    add('planned-dram', wafer, 50, 1.6, 0x526b7d, { ring: chamfer(wafer) });
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 4; col++)
        add(
          `dram-bank-${row}-${col}`,
          { x: -98 + col * 49.5, y: -96 + row * 98, w: 47, d: 94, r: 0.7 },
          51.6,
          0.1,
          0x89a5b5,
          { dram: true },
        );
  }
  const elevation = mode === 'front' ? 90 : mode === 'stack' ? 32 : 52;
  const azimuth = mode === 'front' ? 90 : 65;
  const points = parts.flatMap((s) => k.boxCorners(s.plan, s.z, s.z + s.h));
  const P = k.fitProjection(points, WIDTH, 440, { pad: 20, azimuth, elevation });
  P.origin[1] += 48;
  const R = A.recorder(P);
  for (const s of parts) {
    const shape = s.ring
      ? A.extruded(s.ring, s.z, s.h, { name: s.name, ground: s.z === 0 })
      : A.slab(s.plan, s.z, s.h, { name: s.name, ground: s.z === 0 }, 3);
    const paths = s.ring
      ? k.extrude(s.ring, s.z, s.h, P, { bevel: 0.18 })
      : k.slabOf(s.plan, s.z, s.h, P, 3, 0.08);
    const z = s.z + s.h;
    let inner = '';
    if (s.tile || s.dram || s.gpuGrid) {
      // Fine repeated traces always reach the tile's closed perimeter.
      const inset = k.insetPlan(s.plan, 0.3);
      const lines = [k.planOutline(inset, z, P, 3)];
      const cols = s.dram ? 10 : s.gpuGrid ? 5 : 12,
        rows = s.dram ? 18 : s.gpuGrid ? 5 : 16;
      for (let i = 1; i < cols; i++) {
        const x = inset.x + (inset.w * i) / cols;
        lines.push(k.lineOnTop([x, inset.y], [x, inset.y + inset.d], z, P));
      }
      for (let i = 1; i < rows; i++) {
        const y = inset.y + (inset.d * i) / rows;
        lines.push(k.lineOnTop([inset.x, y], [inset.x + inset.w, y], z, P));
      }
      inner = k.lineSvg(lines.join(''), { tone: 'lo', className: 'wafer-trace' });
      if (s.selected)
        inner += k.lineSvg(k.planOutline(k.insetPlan(s.plan, 0.7), z, P, 3), {
          tone: 'hi',
          className: 'wafer-selected',
        });
    }
    if (s.name.startsWith('edge-')) {
      const dots = [];
      const horizontal = s.plan.w > s.plan.d;
      for (let t = 6; t < (horizontal ? s.plan.w : s.plan.d) - 3; t += 9)
        dots.push(
          k.iso(
            [
              s.plan.x + (horizontal ? t : s.plan.w / 2),
              s.plan.y + (horizontal ? s.plan.d / 2 : t),
              z,
            ],
            P,
          ),
        );
      inner += k.dotsSvg(dots, { size: 0.68, tone: 'hi' });
    }
    const markup = `<g data-part="${s.name}"${s.tile ? ' data-wafer-tile=""' : ''} style="${material(s.color)}">${k.solidSvg(paths, { tone: 'mid', crease: 'lo', inner })}</g>`;
    R.solid(shape);
    R.put({
      name: s.name,
      at: [s.plan.x + s.plan.w / 2, s.plan.y + s.plan.d / 2, z],
      shapes: [shape],
      svg: markup,
    });
  }
  A.settle(R, P, { tolerance: 0.01, least: 0.05 });
  A.auditOrExit(R, P);
  const markup = R.items
    .slice()
    .sort((a, b) => a.key - b.key)
    .map((s) => s.svg)
    .join('');
  const wseBounds = pointBounds(k.boxCorners(wafer, 0, 1.7).map((p) => k.iso(p, P)));
  const gpuBounds = gpu
    ? pointBounds(k.boxCorners(gpu.plan, 0, 1.7).map((p) => k.iso(p, P)))
    : null;
  const selected = parts.find((p) => p.selected);
  return {
    markup: mode === 'stack' ? '' : markup,
    partCount: parts.length,
    wseLabel: [(wseBounds.x + wseBounds.right) / 2, wseBounds.bottom + 25],
    gpuLabel: gpuBounds ? [(gpuBounds.x + gpuBounds.right) / 2, gpuBounds.bottom + 24] : null,
    hotspot: k.planOutline(selected.plan, 1.71, P, 3),
    hotspotCenter: k.iso(
      [selected.plan.x + selected.plan.w / 2, selected.plan.y + selected.plan.d / 2, 1.71],
      P,
    ),
    baseMarkup:
      mode === 'stack'
        ? R.items
            .filter(
              (item) =>
                !item.name.startsWith('planned-dram') &&
                !item.name.startsWith('dram-bank') &&
                !item.name.startsWith('dram-link'),
            )
            .sort((a, b) => a.key - b.key)
            .map((item) => item.svg)
            .join('')
        : '',
    memoryMarkup: R.items
      .filter((item) => item.name.startsWith('planned-dram') || item.name.startsWith('dram-bank'))
      .sort((a, b) => a.key - b.key)
      .map((item) => item.svg)
      .join(''),
    linksMarkup: R.items
      .filter((item) => item.name.startsWith('dram-link'))
      .sort((a, b) => a.key - b.key)
      .map((item) => item.svg)
      .join(''),
    memoryShift: k.screenRise(48.3, P),
  };
}
function core() {
  const parts = [];
  const add = (name, plan, z, h, color, extra = {}) =>
    parts.push({ name, plan, z, h, color, ...extra });
  const base = { x: -80, y: -68, w: 160, d: 136, r: 2 };
  add('tile-silicon', base, 0, 3, 0xc39950);
  add('compute-array', { x: -30, y: -26, w: 62, d: 54, r: 1 }, 3, 2, 0x3f596b, { core: true });
  for (const x of [-67, 44])
    for (let row = 0; row < 4; row++)
      add(`sram-${x}-${row}`, { x, y: -56 + row * 29, w: 23, d: 24, r: 0.6 }, 3, 1.4, 0xb08b3b, {
        sram: true,
      });
  add('router', { x: -16, y: 40, w: 32, d: 17, r: 0.6 }, 3, 1.4, 0x59737f);
  for (let i = 0; i < 6; i++) {
    add(`north-contact-${i}`, { x: -48 + i * 18, y: -65, w: 8, d: 5, r: 0.2 }, 3, 0.4, 0xe6c477);
    add(`south-contact-${i}`, { x: -48 + i * 18, y: 60, w: 8, d: 5, r: 0.2 }, 3, 0.4, 0xe6c477);
  }
  const P = k.fitProjection(k.boxCorners(base, 0, 6), 760, 440, {
    pad: 60,
    azimuth: 66,
    elevation: 52,
  });
  P.origin[1] += 40;
  const R = A.recorder(P);
  const anchors = {};
  for (const s of parts) {
    const shape = A.slab(s.plan, s.z, s.h, { name: s.name, ground: s.z === 0 }, 3),
      z = s.z + s.h;
    const lines = [k.planOutline(k.insetPlan(s.plan, 1), z, P, 3)];
    if (s.sram || s.core) {
      for (let i = 1; i < 8; i++)
        lines.push(
          k.lineOnTop(
            [s.plan.x + 1, s.plan.y + 1 + ((s.plan.d - 2) * i) / 8],
            [s.plan.x + s.plan.w - 1, s.plan.y + 1 + ((s.plan.d - 2) * i) / 8],
            z,
            P,
          ),
        );
    }
    const markup = `<g data-part="${s.name}" class="${s.sram ? 'core-sram' : s.core ? 'core-compute' : ''}" style="${material(s.color)}">${k.solidSvg(k.slabOf(s.plan, s.z, s.h, P, 3, 0.18), { inner: k.lineSvg(lines.join(''), { tone: 'lo' }) })}</g>`;
    R.solid(shape);
    R.put({
      name: s.name,
      at: [s.plan.x + s.plan.w / 2, s.plan.y + s.plan.d / 2, z],
      shapes: [shape],
      svg: markup,
    });
  }
  A.settle(R, P, { tolerance: 0.01, least: 0.05 });
  A.auditOrExit(R, P);
  const left = k.iso([-44, 0, 4], P),
    right = k.iso([-30, 0, 4], P);
  const link = k.segment([-44, 0, 4], [-30, 0, 4], P);
  return {
    markup: R.items
      .slice()
      .sort((a, b) => a.key - b.key)
      .map((p) => p.svg)
      .join(''),
    link,
    left,
    right,
    partCount: parts.length,
  };
}
const result = {
  source,
  width: WIDTH,
  height: HEIGHT,
  reference: {
    wseArea: WSE_AREA,
    gpuArea: REFERENCE_GPU_AREA,
    areaRatio: WSE_AREA / REFERENCE_GPU_AREA,
  },
  iso: build('iso'),
  front: build('front'),
  stack: build('stack'),
  core: core(),
};
mkdirSync('src/papers/ai-memory-wall/generated', { recursive: true });
writeFileSync(
  'src/papers/ai-memory-wall/generated/cerebras-anatomy.json',
  JSON.stringify(result) + '\n',
);
console.log(
  `Cerebras Anatomy: ${result.iso.partCount} wafer solids, ${result.core.partCount} detail solids. Reference area ratio ${result.reference.areaRatio.toFixed(2)}; schematic regions are not physical core counts.`,
);
