import type { PaperDefinition } from './types';
import { validatePapers } from './validate';
const modules = import.meta.glob<PaperDefinition>('./*/paper.ts', { eager: true, import: 'paper' });
export const papers: PaperDefinition[] = Object.values(modules);
validatePapers(papers);
export const defaultPaper = papers.find((p) => p.id === 'ai-memory-wall') ?? papers[0];
if (!defaultPaper)
  throw new Error('등록된 논문이 없습니다. src/papers/<id>/paper.ts를 추가하세요.');
export function availablePapers() {
  const exported = window.__PAPER_EXPORT__?.paperId;
  return exported ? papers.filter((p) => p.id === exported) : papers;
}
