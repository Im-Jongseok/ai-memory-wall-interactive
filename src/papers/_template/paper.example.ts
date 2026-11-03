// Copy this to src/papers/<paper-id>/paper.ts, then fill the real source information.
import type { PaperDefinition } from '../types';
export const paper = {
  id: 'paper-id',
  title: '논문 제목',
  authors: '저자',
  citation: '학술지 · 연도 · 페이지',
  sourceUrl: 'https://example.com/paper',
  pdf: 'papers/paper-id/original.pdf',
  exportFilename: '논문_인터랙티브.html',
  pageSize: { width: 600, height: 800 },
  pages: [
    {
      id: 1,
      printedPage: '1',
      title: '제목과 초록',
      image: 'papers/paper-id/page-1.webp',
      thumbnail: 'papers/paper-id/thumb-1.webp',
    },
  ],
  scenes: [
    {
      id: 'start',
      kind: 'paper',
      page: 1,
      chapter: '제목',
      label: 'PAPER',
      title: '논문 제목',
      stat: '',
      body: '',
      opening: true,
      panTop: 0,
      focus: false,
    },
  ],
} satisfies PaperDefinition;
