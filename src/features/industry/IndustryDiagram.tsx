import { lazy, Suspense } from 'react';
import './industry.css';
const CerebrasModel = lazy(() =>
  import('./CerebrasModel').then((module) => ({ default: module.CerebrasModel })),
);
const CxmtModel = lazy(() =>
  import('./CxmtModel').then((module) => ({ default: module.CxmtModel })),
);
const PimDiagram = lazy(() =>
  import('./PimDiagram').then((module) => ({ default: module.PimDiagram })),
);
export function IndustryDiagram({ topic }: { topic: 'cerebras' | 'cxmt' | 'pim' }) {
  return (
    <Suspense
      fallback={
        <div className="industry-visual" role="status">
          모형 불러오는 중
        </div>
      }
    >
      {topic === 'cerebras' ? <CerebrasModel /> : topic === 'cxmt' ? <CxmtModel /> : <PimDiagram />}
    </Suspense>
  );
}
