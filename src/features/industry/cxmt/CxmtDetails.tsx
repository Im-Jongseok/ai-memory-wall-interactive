import { useCxmtMode } from './context';
import type { IndustryScene } from '../../../papers/types';
import reference from './reference.json';
export function CxmtDetails({ scene }: { scene: IndustryScene }) {
  const { mode } = useCxmtMode();
  const { arrayArea, originalArea, compactArea } = reference;
  const originalCells = arrayArea / originalArea,
    compactCells = arrayArea / compactArea;
  return (
    <div className="industry-details cxmt-details">
      <div className="cxmt-area-comparison" aria-label="같은 F에서 셀 면적 비교">
        <div>
          <span>6F² · 기준</span>
          <strong>{originalArea}F²</strong>
        </div>
        <span className="cxmt-equals" aria-hidden="true">
          →
        </span>
        <div data-active={mode === 'compact' || mode === 'density'}>
          <span>4F² · 면적 축소</span>
          <strong>{compactArea}F²</strong>
        </div>
      </div>
      {mode === 'baseline' ? (
        <p className="cxmt-keyline">
          <strong>6F²는 물리 법칙상의 최솟값이 아니다.</strong>
          <br />
          전하 유지·제조 안정성을 함께 맞춘 배치다. 커패시터는 6F²에서도 이미 수직이며, 여기서
          달라지는 핵심은 채널의 방향이다.
        </p>
      ) : mode === 'compact' ? (
        <div className="cxmt-keyline cxmt-device-challenges">
          <strong>왜 일찍 바꾸지 못했나?</strong>
          <p>
            수직 채널의 깊은 접점 형성, 균일한 절연막·게이트 제조, 누설과 셀 간 간섭을 함께 해결해야
            한다.
          </p>
          <p>게이트가 채널을 둘러싸도 절연막으로 분리되어 있다.</p>
        </div>
      ) : mode === 'array' ? (
        <p className="cxmt-keyline">
          <strong>
            {arrayArea}F² ÷ {originalArea}F² = {originalCells}셀
          </strong>
          <br />
          어레이 경계와 F를 고정한 기준 화면이다. 다음 입력 전까지 이 배열을 유지한다.
        </p>
      ) : (
        <>
          <p className="cxmt-keyline">
            <strong>
              {originalCells}셀 → {compactCells}셀 · {(originalArea / compactArea).toFixed(1)}배
            </strong>
            <br />
            같은 F · 같은 어레이 면적에서의 기하 비교
          </p>
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
        </>
      )}
    </div>
  );
}
