/** Anatomy Figure: the occupied area of a DRAM array, not a CXMT transistor layout.
 * Concept: keep F and the array boundary fixed; shrink twelve 6F² footprints to 4F²,
 * then place six further cells in the freed area. 12×6 = 18×4 = 72F².
 * Parts: silicon field, four boundary rails, 20 F ruler inlays, 12 original cells,
 * six added cells. Engraved F² subdivisions explain area, not physical circuits.
 * Anatomy MIT, commit 1482e8469b0a9e0d8cc18ea2740a01423d29ae80.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import * as k from '../vendor/anatomy/iso-kit.mjs';
import * as A from '../vendor/anatomy/audit.mjs';
const reference = JSON.parse(
  readFileSync(new URL('../../src/features/industry/cxmt/reference.json', import.meta.url), 'utf8'),
);
const F = 18,
  W = 12 * F,
  D = 6 * F;
const base = { x: -6, y: -6, w: W + 12, d: D + 12, r: 1.2 };
const P = k.fitProjection(k.boxCorners(base, 0, 5), 760, 460, {
  pad: 30,
  azimuth: 66,
  elevation: 52,
});
P.origin[1] += 45;
const material = (color) => {
  const tint = (f) =>
    '#' +
    [16, 8, 0]
      .map((s) =>
        Math.min(255, Math.round(((color >> s) & 255) * f))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('');
  return `--anatomy-paper:${tint(1)};--anatomy-top:${tint(1.07)};--anatomy-shade-0:${tint(0.52)};--anatomy-shade-1:${tint(0.66)};--anatomy-shade-2:${tint(0.8)};--anatomy-shade-3:${tint(0.93)};--anatomy-mid:${tint(0.62)};--anatomy-hi:${tint(0.48)};--anatomy-lo:${tint(0.75)}`;
};
function build(compression, added = false, audit = true) {
  const R = A.recorder(P),
    parts = [];
  const add = (name, plan, z, h, color, cell = false, extra = false) =>
    parts.push({ name, plan, z, h, color, cell, extra });
  add('array', base, 0, 2, 0xc3d1d9);
  for (const [name, x, y, w, d] of [
    ['north', -3, -4, W + 6, 1.2],
    ['south', -3, D + 2.8, W + 6, 1.2],
    ['west', -4, -2, 1.2, D + 4],
    ['east', W + 2.8, -2, 1.2, D + 4],
  ])
    add(name, { x, y, w, d, r: 0.1 }, 2, 0.28, 0x7e99aa);
  for (let i = 0; i <= 12; i++)
    add(`x-tick-${i}`, { x: i * F - 0.3, y: D + 3, w: 0.6, d: 1.5, r: 0.05 }, 2.28, 0.12, 0x597b90);
  for (let i = 0; i <= 6; i++)
    add(`y-tick-${i}`, { x: -4.5, y: i * F - 0.3, w: 1.5, d: 0.6, r: 0.05 }, 2.28, 0.12, 0x597b90);
  const span = 3 - compression;
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 4; col++)
      add(
        `cell-${row}-${col}`,
        {
          x: col * span * F + 0.8,
          y: row * 2 * F + 0.8,
          w: span * F - 1.6,
          d: 2 * F - 1.6,
          r: 0.7,
        },
        2,
        2,
        0x8eaab8,
        true,
      );
  if (added)
    for (let row = 0; row < 3; row++)
      for (let col = 4; col < 6; col++)
        add(
          `extra-${row}-${col}`,
          { x: col * 2 * F + 0.8, y: row * 2 * F + 0.8, w: 2 * F - 1.6, d: 2 * F - 1.6, r: 0.7 },
          2,
          2,
          0xd6ae45,
          true,
          true,
        );
  for (const s of parts) {
    const shape = A.slab(s.plan, s.z, s.h, { name: s.name, ground: s.z === 0 }, 3),
      z = s.z + s.h;
    let inner = '';
    if (s.cell) {
      const p = k.insetPlan(s.plan, 0.9),
        lines = [k.planOutline(p, z, P, 3)];
      // All F² grid strokes terminate on the closed cell perimeter.
      for (let i = 1; i <= 2; i++) {
        const fraction = Math.min(1, i / (s.extra ? 2 : span));
        lines.push(
          k.lineOnTop([p.x + p.w * fraction, p.y], [p.x + p.w * fraction, p.y + p.d], z, P),
        );
      }
      lines.push(k.lineOnTop([p.x, p.y + p.d / 2], [p.x + p.w, p.y + p.d / 2], z, P));
      inner = k.lineSvg(lines.join(''), { tone: 'lo', className: 'cxmt-unit-grid' });
    }
    const svg = `<g data-part="${s.name}"${s.cell ? ' data-cell=""' : ''}${s.extra ? ' data-extra=""' : ''} style="${material(s.color)}">${k.solidSvg(k.slabOf(s.plan, s.z, s.h, P, 3, 0.12), { inner, tone: 'mid', crease: 'lo' })}</g>`;
    R.solid(shape);
    R.put({
      name: s.name,
      at: [s.plan.x + s.plan.w / 2, s.plan.y + s.plan.d / 2, z],
      shapes: [shape],
      svg,
    });
  }
  A.settle(R, P, { tolerance: 0.01, least: 0.05 });
  if (audit) A.auditOrExit(R, P);
  return { items: R.items.slice().sort((a, b) => a.key - b.key), partCount: parts.length };
}
const original = build(0),
  compact = build(1),
  dense = build(1, true);
// Compression moves only toward free space. Audit the actual intermediate geometry as well.
if (process.argv.includes('--audit')) for (const t of [0.25, 0.5, 0.75]) build(t);
const paths = (svg) => [...svg.matchAll(/\bd="([^"]*)"/g)].map((m) => m[1]);
const morphs = original.items
  .filter((p) => p.name.startsWith('cell-'))
  .map((p) => {
    const from = paths(p.svg),
      to = paths(compact.items.find((q) => q.name === p.name).svg);
    if (
      from.length !== to.length ||
      from.some(
        (d, i) =>
          d.replace(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi, '#') !==
          to[i].replace(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi, '#'),
      )
    )
      throw Error(`Path topology changed: ${p.name}`);
    return { name: p.name, from, to };
  });
const boundary = k.planOutline({ x: 0, y: 0, w: W, d: D, r: 0 }, 2, P, 1);
const result = {
  source: { name: 'Anatomy', commit: '1482e8469b0a9e0d8cc18ea2740a01423d29ae80', license: 'MIT' },
  reference: {
    f: F,
    ...reference,
    originalCells: reference.arrayArea / reference.originalArea,
    compactCells: reference.arrayArea / reference.compactArea,
  },
  width: 760,
  height: 510,
  partCount: dense.partCount,
  markup: original.items.map((p) => p.svg).join(''),
  extraMarkup: dense.items
    .filter((p) => p.name.startsWith('extra-'))
    .map((p) => p.svg)
    .join(''),
  boundary,
  morphs,
  freedAreaStart: k.planOutline({ x: W, y: 0, w: 0, d: D, r: 0 }, 2.1, P, 1),
  freedArea: k.planOutline({ x: 8 * F, y: 0, w: 4 * F, d: D, r: 0 }, 2.1, P, 1),
};
mkdirSync(new URL('../../src/papers/ai-memory-wall/generated/', import.meta.url), {
  recursive: true,
});
writeFileSync(
  new URL('../../src/papers/ai-memory-wall/generated/cxmt-anatomy.json', import.meta.url),
  JSON.stringify(result) + '\n',
);
console.log(
  `CXMT Anatomy: ${result.partCount} solids; ${12 * 6}F² = ${18 * 4}F²; cell count ratio ${6 / 4}.`,
);
