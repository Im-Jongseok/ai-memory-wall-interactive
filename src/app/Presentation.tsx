import { usePaperToModelTransition } from './usePaperToModelTransition';
import { CEREBRAS_MODES, CXMT_MODES, sceneStepCount } from './scene-steps';
import { PimStepProvider } from '../features/industry/pim/context';
import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import type { PaperDefinition } from '../papers/types';
import { PresentationLayout } from '../components/layout/PresentationLayout';
import { PresentationControls } from '../components/layout/PresentationControls';
import { ExplanationPanel } from '../components/layout/ExplanationPanel';
import { PageExplorer, HelpDialog } from '../components/layout/PresentationDialogs';
import { PaperStage } from '../features/paper/PaperStage';
import { usePaperViewer } from '../features/paper/usePaperViewer';
import { HbmPanel } from '../features/hbm/HbmPanel';
import { CxmtModeProvider } from '../features/industry/cxmt/context';
import { CerebrasModeProvider } from '../features/industry/cerebras/context';
import { IndustryDiagram } from '../features/industry/IndustryDiagram';
export function Presentation({
  paper,
  sceneId,
  onNavigate,
  onLibrary,
}: {
  paper: PaperDefinition;
  sceneId: string;
  onNavigate(paper: PaperDefinition, id: string): void;
  onLibrary(): void;
}) {
  const index = Math.max(
    0,
    paper.scenes.findIndex((s) => s.id === sceneId),
  );
  const [freePage, setFreePage] = useState<number | null>(null);
  const [notes, setNotes] = useState(false);
  const [sourceOnly, setSourceOnly] = useState(false);
  const [toast, setToast] = useState('');
  const rootRef = useRef<HTMLDivElement>(null),
    pageDialog = useRef<HTMLDialogElement>(null),
    helpDialog = useRef<HTMLDialogElement>(null);
  const scene = paper.scenes[index];
  const modelTransition = usePaperToModelTransition();
  const currentScene = useRef(scene);
  currentScene.current = scene;
  const visit = `${paper.id}/${scene.id}/${freePage ?? 'scene'}`;
  const [phase, setPhase] = useState({ visit, index: 0 });
  const phaseIndex = phase.visit === visit ? phase.index : 0;
  const phaseCount = sceneStepCount(scene);
  // Adopt a direct hash/page visit so revisiting it cannot revive an old final phase.
  // Button-driven navigation already supplies its intended first/last phase.
  useLayoutEffect(() => {
    if (phase.visit !== visit) setPhase({ visit, index: 0 });
  }, [phase.visit, visit]);

  const go = useCallback(
    (target: string | number) => {
      const id = typeof target === 'string' ? (paper.aliases?.[target] ?? target) : target;
      const nextIndex =
        typeof id === 'number'
          ? Math.max(0, Math.min(paper.scenes.length - 1, id))
          : paper.scenes.findIndex((s) => s.id === id);
      if (nextIndex < 0) return;
      setFreePage(null);
      if (paper.scenes[nextIndex].kind !== 'paper') setSourceOnly(false);
      const next = paper.scenes[nextIndex];
      if (currentScene.current.id === 'source' && next.kind === 'hbm') {
        modelTransition.start(() => onNavigate(paper, next.id));
      } else {
        modelTransition.clear();
        onNavigate(paper, next.id);
      }
    },
    [paper, onNavigate, modelTransition.start, modelTransition.clear],
  );
  useEffect(() => {
    setFreePage(null);
    if (document.activeElement === document.body) rootRef.current?.focus({ preventScroll: true });
    if (paper.scenes.find((s) => s.id === sceneId)?.kind !== 'paper') setSourceOnly(false);
  }, [paper, sceneId]);
  const showError = useCallback((message: string) => setToast(message), []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timer);
  }, [toast]);
  const { stageRef, engine } = usePaperViewer(paper, scene, freePage, go, showError, sourceOnly);
  const step = (direction: number) => {
    if (direction < 0 && scene.id === 'source' && modelTransition.clear()) return;
    if (freePage !== null) {
      setFreePage(null);
      return;
    }
    const nextPhase = phaseIndex + direction;
    if (nextPhase >= 0 && nextPhase < phaseCount) {
      setPhase({ visit, index: nextPhase });
      return;
    }
    const nextScene = paper.scenes[index + direction];
    if (!nextScene) return;
    setPhase({
      visit: `${paper.id}/${nextScene.id}/scene`,
      index: direction < 0 ? sceneStepCount(nextScene) - 1 : 0,
    });
    go(index + direction);
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      showError('전체 화면은 브라우저의 전체 화면 메뉴에서도 켤 수 있습니다.');
    }
  };
  const handleKeys = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target;
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      (target instanceof Element &&
        !!target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
        ))
    )
      return;
    if (rootRef.current?.querySelector('dialog[open]')) return;
    if (
      (event.key === ' ' || event.key === 'Enter') &&
      target instanceof Element &&
      target.closest('button,a')
    )
      return;
    const paperAction = (action: () => void) => () => {
      if (scene.kind === 'paper' || freePage !== null) action();
    };
    const actions: Record<string, () => void> = {
      arrowdown: () => step(1),
      arrowright: () => step(1),
      pagedown: () => step(1),
      ' ': () => step(1),
      arrowup: () => step(-1),
      arrowleft: () => step(-1),
      pageup: () => step(-1),
      home: () => go(0),
      end: () => go(paper.scenes.length - 1),
      o: paperAction(() => engine.current?.toggleOverview()),
      t: paperAction(() => setSourceOnly((value) => !value)),
      n: () => setNotes((value) => !value),
      m: () => pageDialog.current?.showModal(),
      h: () => helpDialog.current?.showModal(),
      '?': () => helpDialog.current?.showModal(),
      l: onLibrary,
      f: () => void fullscreen(),
      '+': paperAction(() => engine.current?.zoom(1.25)),
      '=': paperAction(() => engine.current?.zoom(1.25)),
      '-': paperAction(() => engine.current?.zoom(0.8)),
      '0': paperAction(() => engine.current?.fit()),
      escape: () => {
        if (sourceOnly) setSourceOnly(false);
        else if (freePage !== null) setFreePage(null);
        else if (scene.kind === 'paper') engine.current?.toggleOverview();
      },
    };
    const action = actions[event.key.toLowerCase()];
    if (action) {
      event.preventDefault();
      // A held arrow must not skip the first explanation on the next slide.
      if (event.repeat && /^(arrow|page|home$|end$| $)/.test(event.key.toLowerCase())) return;
      action();
    }
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleKeys(event);
    window.addEventListener('keydown', listener, true);
    return () => window.removeEventListener('keydown', listener, true);
  }, []);
  const hbmScene = scene.kind === 'hbm' && freePage === null ? scene : undefined;
  const industryScene = scene.kind === 'industry' && freePage === null ? scene : undefined;
  const className = [
    industryScene ? 'industry-scene' : '',
    hbmScene ? 'hbm-scene' : '',
    scene.kind === 'paper' && scene.opening && freePage === null ? 'title-scene' : '',
    sourceOnly ? 'source-only' : '',
  ].join(' ');
  return (
    <CerebrasModeProvider
      mode={
        scene.kind === 'industry' && scene.topic === 'cerebras'
          ? CEREBRAS_MODES[phaseIndex]
          : 'wafer'
      }
    >
      <CxmtModeProvider
        mode={
          scene.kind === 'industry' && scene.topic === 'cxmt' ? CXMT_MODES[phaseIndex] : 'baseline'
        }
      >
        <PimStepProvider
          index={scene.kind === 'industry' && scene.topic === 'pim' ? phaseIndex : 0}
          visit={visit}
          active={scene.kind === 'industry' && scene.topic === 'pim' && freePage === null}
        >
          <PresentationLayout
            rootRef={rootRef}
            className={className}
            source={
              <>
                <PaperStage ref={stageRef} hidden={!!hbmScene || !!industryScene} />
                <HbmPanel
                  rootRef={rootRef}
                  paper={paper}
                  scene={hbmScene}
                  onReady={modelTransition.reveal}
                  preload={scene.id === 'source'}
                  mode={hbmScene?.problems?.[phaseIndex]?.mode}
                  onMode={(mode) => {
                    const selected =
                      hbmScene?.problems?.findIndex((step) => step.mode === mode) ?? -1;
                    if (selected >= 0) setPhase({ visit, index: selected });
                  }}
                />
                {industryScene ? (
                  <IndustryDiagram key={industryScene.id} topic={industryScene.topic} />
                ) : null}
              </>
            }
            explanation={
              <ExplanationPanel paper={paper} scene={scene} freePage={freePage} notes={notes} />
            }
            controls={
              <PresentationControls
                first={index === 0 && freePage === null}
                last={
                  index === paper.scenes.length - 1 &&
                  phaseIndex === phaseCount - 1 &&
                  freePage === null
                }
                onStep={step}
                onFullscreen={() => void fullscreen()}
              />
            }
            overlays={
              <>
                <div id="live-status" className="sr-only" aria-live="polite">
                  {index + 1}/{paper.scenes.length}. {scene.title.replace(/\n/g, ' ')}
                  {phaseCount > 1 ? ` · 설명 ${phaseIndex + 1}/${phaseCount}` : ''}
                </div>
                <div id="toast" className={`toast ${toast ? 'visible' : ''}`} role="status">
                  {toast}
                </div>
                <PageExplorer ref={pageDialog} paper={paper} onSelect={setFreePage} />
                <HelpDialog ref={helpDialog} />
              </>
            }
          />
        </PimStepProvider>
      </CxmtModeProvider>
    </CerebrasModeProvider>
  );
}
