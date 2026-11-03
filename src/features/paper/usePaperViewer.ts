import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPaperEngine } from './paper-engine';
import type { PaperEngine } from './paper-engine';
import type { PaperDefinition, ReviewScene } from '../../papers/types';
export function usePaperViewer(
  paper: PaperDefinition,
  scene: ReviewScene,
  freePage: number | null,
  onNavigate: (id: string) => void,
  onError: (message: string) => void,
  sourceOnly: boolean,
) {
  const stageRef = useRef<HTMLDivElement>(null);
  const engine = useRef<PaperEngine | null>(null);
  useLayoutEffect(() => {
    if (!stageRef.current) return;
    const instance = createPaperEngine(stageRef.current, paper, {
      onNavigate,
      onError,
      onSettled: () => stageRef.current?.closest('.reader')?.scrollTo(0, 0),
    });
    engine.current = instance;
    return () => {
      instance.dispose();
      engine.current = null;
    };
  }, [paper, onNavigate, onError]);
  useLayoutEffect(() => {
    if (scene.kind === 'paper' || freePage !== null) {
      // A free original-page visit can start from a model scene; the camera still needs paper defaults.
      const paperScene =
        scene.kind === 'paper' ? scene : paper.scenes.find((s) => s.kind === 'paper')!;
      engine.current?.render(paperScene, freePage);
    } else engine.current?.suspend();
  }, [paper, scene, freePage]);
  useLayoutEffect(() => {
    engine.current?.resize();
  }, [sourceOnly]);
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      if (!element.hidden) engine.current?.resize();
    });
    observer.observe(element.parentElement!);
    return () => observer.disconnect();
  }, []);
  return { stageRef, engine };
}
