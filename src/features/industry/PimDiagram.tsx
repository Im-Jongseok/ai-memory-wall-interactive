import { useEffect, useRef, useState } from 'react';
import { usePimStep } from './pim-context';
import { PimCoreModel } from './PimCoreModel';
import { PimSystemDiagram } from './PimSystemDiagram';
import { PIM_MODEL, PIM_PRODUCTS, PIM_PARTIALS, PIM_RESULT, PIM_STEPS, pimMode } from './pim-model';
import './pim.css';
function Flow({ d, type }: { d: string; type: string }) {
  return (
    <>
      <path d={d} className="pim-wire" />
      <path d={d} className={`pim-flow pim-flow-${type}`} />
    </>
  );
}
export function PimDiagram() {
  const root = useRef<HTMLElement>(null);
  const { index, setPlaying } = usePimStep();
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const node = root.current!,
      still = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const sync = () => {
      const active = visible && !document.hidden;
      setRunning(active);
      setPlaying(active);
      node.dataset.motion = String(active && !still.matches);
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries.at(-1)!.isIntersecting;
      sync();
    });
    observer.observe(node);
    document.addEventListener('visibilitychange', sync);
    still.addEventListener('change', sync);
    sync();
    return () => {
      observer.disconnect();
      setPlaying(false);
      document.removeEventListener('visibilitychange', sync);
      still.removeEventListener('change', sync);
    };
  }, [setPlaying]);
  const step = PIM_STEPS[index];
  const term: number = step.term;
  const ready = term >= 0;
  const prior = ready && term > 0 ? PIM_PARTIALS[term - 1] : 0;
  return (
    <figure
      ref={root}
      className="industry-visual pim-model"
      data-mode={pimMode(index)}
      data-phase={step.phase}
      data-term={term}
      data-running={running}
      aria-label="HBM-PIM의 PCU 구조, 곱누산 과정과 NPU-PIM 협업"
    >
      <svg
        viewBox="0 0 760 560"
        className="pim-svg"
        role="img"
        aria-label={
          step.phase === 'system'
            ? 'NeuPIMs: NPU는 QKV 생성과 FFN의 행렬 곱, PIM은 KV 캐시를 읽는 어텐션 연산을 맡는다.'
            : `${step.label}. 가중치 2, 1, 0과 입력 1, 2, 3의 곱누산 결과는 4이다.`
        }
      >
        <title>HBM-PIM: 뱅크 곁의 PCU에서 계산한다.</title>
        <g className="pim-local-scene" aria-hidden={step.phase === 'system'}>
          <text x="36" y="31" className="pim-heading">
            HBM-PIM
          </text>
          <text x="36" y="54" className="pim-subheading">
            DRAM 뱅크 곁에 PCU를 배치
          </text>
          <PimCoreModel />
          <g className="pim-compute-detail">
            <rect x="35" y="320" width="687" height="190" rx="7" className="pim-detail-box" />
            <text x="52" y="345" className="pim-detail-title">
              PCU 내부 확대
            </text>
            <text x="209" y="345" className="pim-caption">
              SIMD 중 한 lane의 곱누산을 단순화
            </text>
            <rect x="55" y="378" width="103" height="81" rx="4" className="pim-control" />
            <text x="106" y="407" textAnchor="middle" className="pim-label">
              명령 제어
            </text>
            <text x="106" y="432" textAnchor="middle" className="pim-small">
              명령 해석·실행
            </text>
            <Flow d="M158 418H198" type="command" />
            <rect x="198" y="378" width="114" height="81" rx="4" className="pim-register" />
            <text x="255" y="401" textAnchor="middle" className="pim-label">
              레지스터
            </text>
            <text x="255" y="425" textAnchor="middle" className="pim-number">
              {ready ? `W = ${PIM_MODEL.weights[term]}` : 'W · 입력 x'}
            </text>
            <text x="255" y="447" textAnchor="middle" className="pim-number">
              {ready ? `x = ${PIM_MODEL.input[term]}` : '임시 보관'}
            </text>
            <Flow d="M312 418H352" type="compute" />
            <rect x="352" y="391" width="85" height="57" rx="4" className="pim-multiply" />
            <text x="394" y="414" textAnchor="middle" className="pim-label">
              곱셈
            </text>
            <text x="394" y="437" textAnchor="middle" className="pim-number">
              {ready ? PIM_PRODUCTS[term] : 'W × x'}
            </text>
            <Flow d="M437 418H477" type="compute" />
            <rect x="477" y="391" width="85" height="57" rx="4" className="pim-add" />
            <text x="519" y="414" textAnchor="middle" className="pim-label">
              덧셈
            </text>
            <text x="519" y="437" textAnchor="middle" className="pim-number">
              {ready ? `${prior} + ${PIM_PRODUCTS[term]}` : '앞선 합 +'}
            </text>
            <Flow d="M562 418H602" type="compute" />
            <rect x="602" y="391" width="98" height="57" rx="4" className="pim-accumulator" />
            <text x="651" y="414" textAnchor="middle" className="pim-label">
              누산값
            </text>
            <text x="651" y="438" textAnchor="middle" className="pim-accumulator-value">
              {ready ? PIM_PARTIALS[term] : 0}
            </text>
            <Flow d="M651 448V482H519V448" type="compute" />
            <text x="586" y="499" textAnchor="middle" className="pim-small">
              앞선 합을 다음 계산에 재사용
            </text>
          </g>
        </g>
        <PimSystemDiagram active={step.phase === 'system'} />
        <text x="380" y="545" textAnchor="middle" className="pim-step-label">
          {step.label}
        </text>
      </svg>
      <p className="sr-only" aria-live="polite">
        {step.label}
        {ready
          ? `. ${PIM_MODEL.weights[term]} 곱하기 ${PIM_MODEL.input[term]}를 ${prior}에 더해 누산값 ${PIM_PARTIALS[term]}.`
          : ''}
      </p>
    </figure>
  );
}
