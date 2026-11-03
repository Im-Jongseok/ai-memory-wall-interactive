import type { PaperDefinition } from '../papers/types';
import { assetUrl } from './assets';
export function PaperLibrary({
  papers,
  onSelect,
}: {
  papers: PaperDefinition[];
  onSelect(paper: PaperDefinition): void;
}) {
  return (
    <main className="paper-library">
      <header>
        <p className="eyebrow">PAPER REVIEWS</p>
        <h1>논문 리뷰</h1>
        <p>원문과 그림을 따라 읽는 발표 자료</p>
      </header>
      <div className="paper-library-grid">
        {papers.map((paper) => (
          <button className="paper-library-card" key={paper.id} onClick={() => onSelect(paper)}>
            <img src={assetUrl(paper.pages[0].thumbnail)} alt={`${paper.title} 첫 페이지`} />
            <div>
              <h2>{paper.title}</h2>
              <p>{paper.authors}</p>
              <p>{paper.citation}</p>
              <span>{paper.scenes.length}개 장면 · 발표 열기 →</span>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
