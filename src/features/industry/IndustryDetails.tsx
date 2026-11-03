import { useCerebrasMode } from './cerebras-context';
import { PimDetails } from './PimDetails';
import { CxmtDetails } from './CxmtDetails';
import { CerebrasDetails } from './CerebrasDetails';
import type { IndustryScene } from '../../papers/types';
export function IndustryDetails({ scene }: { scene: IndustryScene }) {
  const { mode } = useCerebrasMode();
  if (scene.topic === 'pim') return <PimDetails />;
  if (scene.topic === 'cxmt') return <CxmtDetails scene={scene} />;
  if (scene.topic === 'cerebras' && mode !== 'wafer') return <CerebrasDetails />;
  return (
    <div className="industry-details">
      <ol className="industry-updates">
        {scene.updates.map((update) => (
          <li key={update.date}>
            <div>
              <time>{update.date}</time>
              <span className="industry-status">{update.status}</span>
            </div>
            <p>{update.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
