import { useEffect, useRef, useState } from 'react';
import { useCerebrasMode } from './cerebras-context';
import { useCerebrasMotion } from './useCerebrasMotion';
import model from '../../papers/ai-memory-wall/generated/cerebras-anatomy.json';
import cerebrasLogo from './assets/cerebras-logo-black.png?inline';
import './cerebras-model.css';

// Trusted, build-generated Anatomy geometry only. No website HTML enters this markup.
const ART = {
  iso: <g key="wafer-iso" dangerouslySetInnerHTML={{ __html: model.iso.markup }} />,
  stackBase: (
    <g key="wafer-stack-base" dangerouslySetInnerHTML={{ __html: model.stack.baseMarkup }} />
  ),
  stackMemory: (
    <g key="wafer-stack-memory" dangerouslySetInnerHTML={{ __html: model.stack.memoryMarkup }} />
  ),
  stackLinks: (
    <g key="wafer-stack-links" dangerouslySetInnerHTML={{ __html: model.stack.linksMarkup }} />
  ),
  core: <g key="wafer-core" dangerouslySetInnerHTML={{ __html: model.core.markup }} />,
};
export function CerebrasModel() {
  const { mode } = useCerebrasMode();
  const [running, setRunning] = useState(false),
    [reduced, setReduced] = useState(false);
  const wafer = useRef<SVGGElement>(null),
    core = useRef<SVGGElement>(null),
    stack = useRef<SVGGElement>(null),
    memory = useRef<SVGGElement>(null),
    links = useRef<SVGGElement>(null);
  const root = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const sync = () => {
      const running = visible && !document.hidden;
      setRunning(running);
      setReduced(still.matches);
      node.dataset.running = String(running && !still.matches);
      if (running && !still.matches) svg.current?.unpauseAnimations();
      else svg.current?.pauseAnimations();
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      sync();
    });
    observer.observe(node);
    document.addEventListener('visibilitychange', sync);
    still.addEventListener('change', sync);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      still.removeEventListener('change', sync);
    };
  }, []);
  const geometry = mode === 'stack' ? model.stack : model.iso;
  useCerebrasMotion(
    mode,
    { wafer, core, stack, memory, links },
    geometry.hotspotCenter,
    model.stack.hotspotCenter,
    model.stack.memoryShift,
    running,
    reduced,
  );
  const description =
    mode === 'core'
      ? '타일 하나의 구조를 확대해 SRAM 뱅크와 연산부를 가깝게 배치한 개념 모형'
      : mode === 'stack'
        ? 'CS-6의 향후 DRAM 적층 방향. 연결을 보이도록 층 사이를 벌린 개념 분해도'
        : '첨부 이미지의 사각 금빛 Cerebras 웨이퍼와 GPU를 같은 면적 비율로 단순화한 모형';
  return (
    <figure
      ref={root}
      className="industry-visual wse-model"
      data-mode={mode}
      aria-label="Cerebras Anatomy 모형"
    >
      <img className="wse-brandmark" src={cerebrasLogo} alt="Cerebras" width="144" height="64" />
      <svg
        ref={svg}
        className="wse-figure-svg"
        viewBox="0 0 760 550"
        role="img"
        aria-label={description}
      >
        <title>{description}</title>
        <g ref={wafer} className="wse-scene" data-scene="wafer" aria-hidden={mode !== 'wafer'}>
          {ART.iso}
          <path className="wse-tile-hit" d={model.iso.hotspot}>
            <title>연산·SRAM 타일 확대</title>
          </path>
          <text
            x={model.iso.wseLabel[0]}
            y={model.iso.wseLabel[1]}
            textAnchor="middle"
            className="wse-model-label"
          >
            Cerebras WSE
          </text>
          <text
            x={model.iso.gpuLabel![0]}
            y={model.iso.gpuLabel![1]}
            textAnchor="middle"
            className="wse-model-label wse-gpu-label"
          >
            GPU · 크기 비교
          </text>
        </g>
        <g ref={core} className="wse-scene" data-scene="core" aria-hidden={mode !== 'core'}>
          {ART.core}
          <path className="wse-local-link iso-line" d={model.core.link} />
          {[model.core.left, model.core.right].map(([cx, cy], index) => (
            <circle key={index} cx={cx} cy={cy} r="3" className="wse-terminal" />
          ))}
          <circle r="3" className="wse-read-particle">
            <animateMotion dur="2s" repeatCount="indefinite" path={model.core.link} />
          </circle>
          <text x="380" y="62" textAnchor="middle" className="wse-core-heading">
            가중치가 있는 곳 가까이에서 계산
          </text>
          <g className="wse-core-legend">
            <rect x="210" y="451" width="12" height="12" fill="#c09a48" />
            <text x="231" y="462">
              SRAM · 가중치 유지
            </text>
            <rect x="430" y="451" width="12" height="12" fill="#45667b" />
            <text x="451" y="462">
              AI 연산 코어
            </text>
          </g>
        </g>
        <g ref={stack} className="wse-scene" data-scene="stack" aria-hidden={mode !== 'stack'}>
          {ART.stackBase}
          <g ref={links}>{ART.stackLinks}</g>
          <g ref={memory}>{ART.stackMemory}</g>
          <text x="380" y="42" textAnchor="middle" className="wse-stack-label">
            DRAM을 수직으로 가까이 연결
          </text>
        </g>
      </svg>
      <div className="wse-readout" aria-live="polite" aria-hidden={mode !== 'wafer'}>
        {mode === 'wafer' ? (
          <>
            <strong>46,225 mm²</strong>
            <span>웨이퍼 면적</span>
            <i />
            <strong>{model.reference.areaRatio.toFixed(1)}×</strong>
            <span>첨부 이미지의 GPU 대비 면적</span>
          </>
        ) : null}
      </div>
    </figure>
  );
}
