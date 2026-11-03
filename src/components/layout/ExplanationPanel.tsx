import { usePimStep } from '../../features/industry/pim/context';
import { PIM_EXPLANATION, pimMode } from '../../features/industry/pim/model';
import { useEffect, useRef } from 'react';
import { assetUrl } from '../../app/assets';
import type { PaperDefinition, ReviewScene } from '../../papers/types';
import { useCerebrasMode } from '../../features/industry/cerebras/context';
import { useCxmtMode } from '../../features/industry/cxmt/context';
import { CXMT_EXPLANATION } from '../../features/industry/cxmt/explanation';
import { CEREBRAS_EXPLANATION } from '../../features/industry/cerebras/explanation';
import { IndustryDetails } from '../../features/industry/IndustryDetails';
export function ExplanationPanel({
  paper,
  scene,
  freePage,
  notes,
}: {
  paper: PaperDefinition;
  scene: ReviewScene;
  freePage: number | null;
  notes: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const page = paper.pages.find((p) => p.id === freePage);
  const { mode } = useCerebrasMode();
  const { index: pimIndex } = usePimStep();
  const pimView = pimMode(pimIndex);
  const { mode: cxmtMode } = useCxmtMode();
  const text =
    scene.kind === 'industry' && scene.topic === 'cerebras' && mode !== 'wafer'
      ? CEREBRAS_EXPLANATION[mode]
      : scene.kind === 'industry' && scene.topic === 'cxmt'
        ? CXMT_EXPLANATION[cxmtMode]
        : scene.kind === 'industry' && scene.topic === 'pim'
          ? PIM_EXPLANATION[pimView]
          : scene;
  const stat = page ? '원문 탐색' : text.stat;
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.scrollTop = 0;
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.classList.remove('scene-enter');
      void node.offsetWidth;
      node.classList.add('scene-enter');
    }
  }, [scene.id, freePage, mode, cxmtMode, pimView]);
  return (
    <aside
      ref={ref}
      id="interpretation"
      className="interpretation"
      data-industry-topic={scene.kind === 'industry' ? scene.topic : undefined}
      data-cxmt-mode={scene.kind === 'industry' && scene.topic === 'cxmt' ? cxmtMode : undefined}
      data-cerebras-mode={
        scene.kind === 'industry' && scene.topic === 'cerebras' ? mode : undefined
      }
    >
      <div className="scene-heading">
        <div id="scene-kicker" className="eyebrow">
          {page ? 'ORIGINAL PAPER' : text.label}
        </div>
        <h1 id="scene-title">{page ? `원문 p.${page.printedPage}\n직접 탐색하기` : text.title}</h1>
      </div>
      <div
        id="scene-stat"
        className={`scene-stat ${stat.length > 25 ? 'long' : ''}`}
        hidden={!stat}
      >
        {stat}
      </div>
      <p id="scene-body" className="scene-body">
        {page
          ? '표시된 영역을 선택하면 해당 그림이나 문단으로 이동합니다. 휠이나 드래그로 이동하고, Ctrl+휠로 확대할 수 있습니다.'
          : text.body}
      </p>
      {scene.kind === 'industry' && !page ? <IndustryDetails scene={scene} /> : null}
      <section
        id="hbm-basics"
        className="hbm-basics"
        aria-label="기본 구조와 데이터 경로"
        hidden={scene.kind !== 'hbm' || !!page}
      />
      <p
        id="hbm-issue-heading"
        className="hbm-issue-heading"
        hidden={scene.kind !== 'hbm' || !!page}
      >
        대역폭을 높일 때의 제약
      </p>
      <ol
        id="hbm-problems"
        className="hbm-problems"
        aria-label="데이터 이동과 대역폭 제약의 설명 단계"
        hidden={scene.kind !== 'hbm' || !!page}
      />
      <div
        id="figure-tabs"
        className="figure-tabs"
        hidden={!!page || !paper.conditions?.[scene.id]}
      >
        <p className="condition" style={{ whiteSpace: 'pre-line' }}>
          {paper.conditions?.[scene.id]}
        </p>
      </div>
      <div id="notes-panel" className="notes-panel" hidden={!notes}>
        <div className="eyebrow">PRESENTER NOTES</div>
        <div id="scene-notes">{scene.note?.replace(/^- /gm, '• ')}</div>
      </div>
      <div id="source-reference" className="source-reference" hidden={scene.id !== 'source'}>
        <a href={paper.sourceUrl} target="_blank" rel="noopener noreferrer">
          원문 보기 ↗
        </a>
        <a
          href={assetUrl(paper.pdf)}
          download={window.__PAPER_EXPORT__ ? `${paper.id}.pdf` : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          제공된 PDF 열기 ↗
        </a>
      </div>
    </aside>
  );
}
