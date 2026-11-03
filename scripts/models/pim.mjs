/** Figure: HBM core die with two DRAM banks and a shared SIMD PCU; host beside it.
 * Schematic floorplan, not a reproduction of Aquabolt-XL or NeuPIMs chip dimensions.
 * Parts: two substrates/dies, bank arrays, 16 PCU lanes, host compute tiles,
 * interface pads and chip-edge contacts. Uses the same Anatomy projection as Cerebras.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import * as k from '../vendor/anatomy/iso-kit.mjs';
import * as A from '../vendor/anatomy/audit.mjs';
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
const tint = (c, f) =>
  hex([16, 8, 0].reduce((a, s) => a + (Math.min(255, Math.round(((c >> s) & 255) * f)) << s), 0));
const material = (c) =>
  `--anatomy-paper:${hex(c)};--anatomy-top:${tint(c, 1.09)};--anatomy-shade-0:${tint(c, 0.5)};--anatomy-shade-1:${tint(c, 0.64)};--anatomy-shade-2:${tint(c, 0.77)};--anatomy-shade-3:${tint(c, 0.9)};--anatomy-hi:${tint(c, 0.55)};--anatomy-mid:${tint(c, 0.64)};--anatomy-lo:${tint(c, 0.75)}`;
function build(system) {
  const parts = [];
  const add = (name, x, y, w, d, z, h, color, grid = false) =>
    parts.push({ name, plan: { x, y, w, d, r: 0.5 }, z, h, color, grid });
  const memoryX = system ? 45 : -120,
    hostX = system ? -120 : 65;
  const memoryW = 135,
    hostW = 90;
  const mx = memoryX,
    hx = hostX;
  add('memory-substrate', mx - 5, -64, memoryW + 10, 128, 0, 2, 0x96b1c0);
  add('memory-core-die', mx, -59, memoryW, 118, 2, 2, 0x658c9e);
  add('dram-bank-0', mx + 7, -50, 42, 100, 4, 0.8, 0x9ebcc9, true);
  add('dram-bank-1', mx + 86, -50, 42, 100, 4, 0.8, 0x9ebcc9, true);
  add('pcu-body', mx + 55, -39, 25, 78, 4, 1.2, 0xb38b36);
  for (let row = 0; row < 8; row++)
    for (let col = 0; col < 2; col++)
      add(
        `simd-lane-${row * 2 + col}`,
        mx + 57 + col * 11,
        -36 + row * 8.7,
        8,
        6.3,
        5.2,
        0.3,
        0xe2b941,
      );
  add('host-substrate', hx - 5, -49, hostW + 10, 98, 0, 2, 0x7e9dab);
  add('host-die', hx, -44, hostW, 88, 2, 4, 0x45667b);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 4; col++)
      add(
        `host-compute-${row}-${col}`,
        hx + 8 + col * 19,
        -35 + row * 18,
        15,
        14,
        6,
        0.5,
        0x89adbf,
        true,
      );
  for (let i = 0; i < 10; i++) {
    add(`memory-contact-n-${i}`, mx + 7 + i * 12, -57, 6, 3, 4, 0.25, 0xd8c48d);
    add(`memory-contact-s-${i}`, mx + 7 + i * 12, 54, 6, 3, 4, 0.25, 0xd8c48d);
  }
  for (let i = 0; i < 6; i++) add(`host-contact-${i}`, hx + 8 + i * 13, 39, 7, 3, 6, 0.2, 0xd8c48d);
  const points = parts.flatMap((p) => k.boxCorners(p.plan, p.z, p.h));
  const P = k.fitProjection(points, 760, 425, { pad: 55, azimuth: 66, elevation: 52 });
  P.origin[1] += 70;
  const R = A.recorder(P);
  for (const p of parts) {
    const shape = A.slab(p.plan, p.z, p.h, { name: p.name, ground: p.z === 0 }, 3),
      top = p.z + p.h;
    let traces = k.planOutline(k.insetPlan(p.plan, 0.8), top, P, 3);
    if (p.grid) {
      for (let i = 1; i < 8; i++)
        traces += k.lineOnTop(
          [p.plan.x + 0.8, p.plan.y + 0.8 + ((p.plan.d - 1.6) * i) / 8],
          [p.plan.x + p.plan.w - 0.8, p.plan.y + 0.8 + ((p.plan.d - 1.6) * i) / 8],
          top,
          P,
        );
      for (let i = 1; i < 5; i++)
        traces += k.lineOnTop(
          [p.plan.x + 0.8 + ((p.plan.w - 1.6) * i) / 5, p.plan.y + 0.8],
          [p.plan.x + 0.8 + ((p.plan.w - 1.6) * i) / 5, p.plan.y + p.plan.d - 0.8],
          top,
          P,
        );
    }
    R.solid(shape);
    R.put({
      name: p.name,
      at: [p.plan.x + p.plan.w / 2, p.plan.y + p.plan.d / 2, top],
      shapes: [shape],
      svg: `<g data-part="${p.name}" style="${material(p.color)}">${k.solidSvg(k.slabOf(p.plan, p.z, p.h, P, 3, 0.15), { inner: k.lineSvg(traces, { tone: 'lo' }) })}</g>`,
    });
  }
  A.settle(R, P, { tolerance: 0.01, least: 0.05 });
  A.auditOrExit(R, P);
  const pt = (p) => k.iso(p, P);
  const memoryPort = [mx + (system ? 0 : memoryW), 0, 4];
  const hostPort = [hx + (system ? hostW : 0), 0, 6];
  const command = [
    pt(hostPort),
    pt([hostPort[0], -8, 4]),
    pt([memoryPort[0], -8, 4]),
    pt(memoryPort),
  ];
  const result = [pt(memoryPort), pt([memoryPort[0], 8, 4]), pt([hostPort[0], 8, 4]), pt(hostPort)];
  return {
    markup: R.items
      .sort((a, b) => a.key - b.key)
      .map((i) => i.svg)
      .join(''),
    partCount: parts.length,
    anchors: {
      memory: pt([mx + memoryW / 2, -59, 4]),
      bank: pt([mx + 28, 0, 4.8]),
      pcu: pt([mx + 67.5, 0, 5.5]),
      host: pt([hx + hostW / 2, -44, 6]),
      memoryPort: pt(memoryPort),
      hostPort: pt(hostPort),
    },
    command: k.pathOf(command),
    result: k.pathOf(result),
    read: k.segment([mx + 49, 0, 4.9], [mx + 55, 0, 4.9], P),
  };
}
const core = build(false),
  system = build(true);
mkdirSync(new URL('../../src/papers/ai-memory-wall/generated/', import.meta.url), {
  recursive: true,
});
writeFileSync(
  new URL('../../src/papers/ai-memory-wall/generated/pim-anatomy.json', import.meta.url),
  JSON.stringify({
    source: { name: 'Anatomy', commit: '1482e8469b0a9e0d8cc18ea2740a01423d29ae80', license: 'MIT' },
    core,
    system,
  }) + '\n',
);
console.log(
  `PIM Anatomy: ${core.partCount} core solids, ${system.partCount} system solids. Schematic layout.`,
);
