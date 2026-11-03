import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { HbmEngine } from './hbm-engine';
import type { HbmScene, HbmMode, PaperDefinition } from '../../papers/types';
import { assetUrl } from '../../app/assets';
export function HbmPanel({
  rootRef,
  paper,
  scene,
  mode,
  onMode,
  onReady,
  preload = false,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  paper: PaperDefinition;
  scene?: HbmScene;
  mode?: Exclude<HbmMode, 'sequence'>;
  onMode(mode: Exclude<HbmMode, 'sequence'>): void;
  onReady(): void;
  preload?: boolean;
}) {
  const readyCallback = useRef(onReady);
  readyCallback.current = onReady;
  const engine = useRef<HbmEngine | null>(null);
  const latestScene = useRef(scene);
  latestScene.current = scene;
  const latestMode = useRef(mode);
  latestMode.current = mode;
  const latestOnMode = useRef(onMode);
  latestOnMode.current = onMode;
  const feature = paper.features?.hbm;
  useEffect(() => {
    if (feature && preload) {
      const id = window.requestIdleCallback?.(() => void import('./hbm-engine'));
      return () => {
        if (id !== undefined) window.cancelIdleCallback(id);
      };
    }
  }, [feature, preload]);
  const enabled = !!scene && !!feature;
  useEffect(() => {
    if (!enabled || !feature) return;
    let cancelled = false;
    // Three.js is downloaded only for papers and scenes that actually use this feature.
    void import('./hbm-engine').then(({ createHbmEngine }) => {
      if (cancelled || !rootRef.current) return;
      const steps =
        paper.scenes.find((s): s is HbmScene => s.kind === 'hbm' && !!s.problems)?.problems ?? [];
      engine.current = createHbmEngine(rootRef.current, {
        geometry: feature.geometry,
        onReady: () => readyCallback.current(),
        steps,
        onMode: (mode) => latestOnMode.current(mode),
      });
      if (latestScene.current) engine.current.show(latestScene.current.mode);
      if (latestMode.current) engine.current.select(latestMode.current);
    });
    return () => {
      cancelled = true;
      engine.current?.dispose();
      engine.current = null;
    };
  }, [enabled, feature, paper, rootRef]);
  useEffect(() => {
    if (scene) engine.current?.show(scene.mode);
  }, [scene]);
  useEffect(() => {
    if (mode) engine.current?.select(mode);
  }, [mode]);
  return (
    <section id="hbm-panel" className="hbm-panel" aria-label="HBM 패키지 3D 모형" hidden={!enabled}>
      <div id="hbm-view" className="hbm-view">
        <svg id="hbm-callouts" className="hbm-callouts" aria-hidden="true" />
        <div id="hbm-stack-label" className="hbm-stack-label">
          HBM<span>DRAM 적층 + 베이스 다이</span>
        </div>
        <button
          id="hbm-gpu-label"
          className="hbm-device-label"
          data-part="gpu"
          type="button"
          aria-label="GPU · 연산 장치"
        >
          GPU<span>데이터를 받아 계산하는 연산 장치</span>
        </button>
        <div id="hbm-parts" className="hbm-parts" aria-label="부품 라벨" />
        <div id="hbm-tooltip" className="hbm-tooltip" role="tooltip" hidden>
          <strong />
          <p />
        </div>
        <div id="hbm-effect" className="hbm-effect" hidden>
          <div className="hbm-effect-heading">
            <strong id="hbm-effect-title" />
            <span>원리 설명용</span>
          </div>
          <svg
            id="hbm-effect-graphic"
            viewBox="0 0 260 132"
            role="img"
            aria-label="대역폭 제약의 원리 설명"
          />
          <p id="hbm-effect-caption" />
        </div>
        <div id="hbm-fallback" className="hbm-fallback" hidden>
          {feature ? (
            <img
              src={assetUrl(feature.fallback)}
              alt="DRAM 적층과 TSV, 인터포저와 GPU의 HBM 패키지 단면 모형"
            />
          ) : null}
          <p>HBM · DRAM 적층과 TSV / 공통 인터포저 / GPU</p>
        </div>
      </div>
    </section>
  );
}
