import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCxmtMode } from './context';
import { CxmtCellStructure } from './CxmtCellStructure';
import model from '../../../papers/ai-memory-wall/generated/cxmt-anatomy.json';
import './model.css';
const NUMBER = /[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi;
const ART = <g dangerouslySetInnerHTML={{ __html: model.markup }} />;
const EXTRA = <g dangerouslySetInnerHTML={{ __html: model.extraMarkup }} />;
interface Track {
  node: SVGPathElement;
  template: string;
  from: number[];
  to: number[];
}
/** Linear world-space footprint change, with eased time. No per-frame React updates. */
export function CxmtModel() {
  const { mode } = useCxmtMode();
  const root = useRef<HTMLElement>(null),
    art = useRef<SVGGElement>(null),
    extra = useRef<SVGGElement>(null),
    freed = useRef<SVGPathElement>(null);
  const [running, setRunning] = useState(false),
    [reduced, setReduced] = useState(false);
  const tracks = useRef<Track[]>([]),
    pose = useRef({ compression: 0, fill: 0 });
  const motion = useRef({
    from: { compression: 0, fill: 0 },
    to: { compression: 0, fill: 0 },
    elapsed: 0,
    duration: 0,
  });
  useLayoutEffect(() => {
    tracks.current = model.morphs.flatMap((cell) => {
      const paths = art.current!.querySelectorAll<SVGPathElement>(
        `[data-part="${cell.name}"] path`,
      );
      return cell.from.map((d, i) => ({
        node: paths[i],
        template: d,
        from: (d.match(NUMBER) ?? []).map(Number),
        to: (cell.to[i].match(NUMBER) ?? []).map(Number),
      }));
    });
    tracks.current.push({
      node: freed.current!,
      template: model.freedAreaStart,
      from: (model.freedAreaStart.match(NUMBER) ?? []).map(Number),
      to: (model.freedArea.match(NUMBER) ?? []).map(Number),
    });
  }, []);
  useLayoutEffect(() => {
    motion.current = {
      from: { ...pose.current },
      to: { compression: mode === 'density' ? 1 : 0, fill: mode === 'density' ? 1 : 0 },
      elapsed: 0,
      duration: reduced ? 0 : 1700,
    };
  }, [mode, reduced]);
  useEffect(() => {
    const node = root.current!;
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const sync = () => {
      setRunning(visible && !document.hidden);
      setReduced(still.matches);
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
      document.removeEventListener('visibilitychange', sync);
      still.removeEventListener('change', sync);
    };
  }, []);
  useEffect(() => {
    if (!running) return;
    let frame = 0,
      before = performance.now();
    const draw = (now: number) => {
      const m = motion.current;
      m.elapsed += Math.max(0, now - before);
      before = now;
      const t = m.duration === 0 ? 1 : Math.min(1, m.elapsed / m.duration);
      const ease = (v: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, v)), 3);
      // Shrink first, then fill the released space. Reverse in the opposite order.
      const expanding = m.to.compression < m.from.compression;
      const compressionT = expanding ? (t - 0.4) / 0.6 : t / 0.6;
      const fillT = expanding ? t / 0.4 : (t - 0.6) / 0.4;
      const compression =
        m.from.compression + (m.to.compression - m.from.compression) * ease(compressionT);
      const fill = m.from.fill + (m.to.fill - m.from.fill) * ease(fillT);
      root.current!.dataset.arrayCompression = compression.toFixed(3);
      root.current!.dataset.arrayFill = fill.toFixed(3);
      if (compression !== pose.current.compression) {
        for (const track of tracks.current) {
          let i = 0;
          track.node.setAttribute(
            'd',
            track.template.replace(NUMBER, () => {
              const value = track.from[i] + (track.to[i] - track.from[i]) * compression;
              i++;
              return value.toFixed(2);
            }),
          );
        }
      }
      freed.current!.style.opacity = String(compression * (1 - fill));
      extra.current!.querySelectorAll<SVGGElement>('[data-extra]').forEach((node, i) => {
        const amount = Math.max(0, Math.min(1, (fill - i * 0.06) / 0.7));
        node.style.opacity = String(amount);
        node.style.transform = reduced ? 'none' : `translateY(${-8 * (1 - amount)}px)`;
      });
      pose.current = { compression, fill };
      if (t < 1) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [mode, running, reduced]);
  const showingArray = mode === 'array' || mode === 'density';
  const count = mode === 'density' ? model.reference.compactCells : model.reference.originalCells;
  return (
    <figure
      ref={root}
      className="industry-visual cxmt-model"
      data-mode={mode}
      data-running={running}
      data-showing-array={showingArray}
      aria-label="CXMT 4F² 셀 면적과 저장 밀도 Anatomy 모형"
    >
      <div className="cxmt-structure-layer" aria-hidden={showingArray}>
        <CxmtCellStructure mode={mode} />
      </div>
      <div className="cxmt-density-layer" aria-hidden={!showingArray}>
        <svg
          viewBox="0 0 760 510"
          role="img"
          aria-label={`같은 F, 같은 72F² 어레이 면적. ${mode === 'density' ? '4F²' : '6F²'} 셀 ${count}개. 셀의 점유 면적을 블록으로 표현한 개념도.`}
        >
          <title>셀 면적을 줄여 같은 면적에 더 많은 비트를 저장한다.</title>
          <text x="58" y="50" className="cxmt-model-title">
            {mode === 'density' ? '4F²' : '6F²'}
          </text>
          <text x="150" y="49" className="cxmt-model-subtitle">
            같은 F · 같은 어레이 면적
          </text>
          <g ref={art}>{ART}</g>
          <path d={model.freedArea} ref={freed} className="cxmt-freed-area" />
          <g ref={extra} className="cxmt-added-cells">
            {EXTRA}
          </g>
        </svg>
      </div>
      <p className="sr-only" aria-live="polite">
        {mode === 'baseline'
          ? '6F²는 매립 게이트와 양쪽 접점의 배치 공간을 확보한 대표적인 셀 구조다.'
          : mode === 'compact'
            ? '수직 채널로 바닥 면적을 줄이고 둘레 게이트로 전류를 제어하는 4F²의 원리를 보여 준다.'
            : mode === 'array'
              ? '6F² 셀 열두 개의 기준 배열. 다음 입력까지 유지한다.'
              : '추가 셀 여섯 개를 배치해 같은 면적에 열여덟 셀을 저장한다.'}
      </p>
    </figure>
  );
}
