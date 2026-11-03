import type { PaperDefinition } from '../types';
import { scenes } from './scenes';
import geometry from './generated/hbm-anatomy.json';
const asset = (name: string) => `papers/ai-memory-wall/${name}`;
const titles = [
  '문제 제기\n초록·배경',
  '성장의 격차\nFig. 1 · Fig. 2',
  '지표와 실험 조건\n식 (1) · 각주 c·d',
  '프로파일링\nFig. 3a–d',
  '학습과 배포\nFig. 4 · 해결책',
  '가속기 설계와 결론',
  '저자 소개',
];
export const paper = {
  id: 'ai-memory-wall',
  title: 'AI and Memory Wall',
  authors: 'Amir Gholami et al.',
  citation: 'IEEE Micro 44(3), 2024 · pp.33–39',
  sourceUrl: 'https://ieeexplore.ieee.org/document/10477550',
  pdf: asset('AI-and-Memory-Wall-IEEE.pdf'),
  exportFilename: 'AI_and_Memory_Wall_인터랙티브.html',
  pageSize: { width: 566.929, height: 773.858 },
  pages: titles.map((title, i) => ({
    id: i + 1,
    printedPage: String(i + 33),
    title,
    image: asset(`page-${i + 1}.webp`),
    thumbnail: asset(`thumb-${i + 1}.webp`),
  })),
  scenes,
  aliases: {
    'pim-cim': 'pim',
    'hbm-structure': 'hbm-data-path',
    'hbm-bandwidth': 'hbm-data-path',
    'hbm-limits': 'hbm-data-path',
    'hbm-power': 'hbm-data-path',
    'p1-in': 'fig1',
    'p2-in': 'fig2',
    'p3-in': 'equation',
    'p3-out': 'fig3a',
    'p4-in': 'fig3a',
    'p4-out': 'fig4',
    'p5-in': 'fig4',
    'p6-in': 'hardware',
  },
  conditions: Object.fromEntries(
    ['fig3a', 'fig3b', 'fig3c', 'fig3d'].map((id) => [
      id,
      'Intel Gold 6242 CPU · 배치 크기 1\n비교 기준: 시퀀스 길이 128',
    ]),
  ),
  features: { hbm: { geometry, fallback: asset('hbm-anatomy.svg') } },
} satisfies PaperDefinition;
