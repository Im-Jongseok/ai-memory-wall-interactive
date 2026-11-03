import type { DemoStep, HbmMode } from '../../papers/types';
export interface HbmEngine {
  show(mode: HbmMode): void;
  select(mode: Exclude<HbmMode, 'sequence'>): void;
  hide(): void;
  resize(): void;
  dispose(): void;
  status(): {
    active: boolean;
    mode: HbmMode;
    failed: boolean;
    renderedFrames: number;
    visibleLanes: number;
    progress: number;
    heat: number;
  };
}
export function createHbmEngine(
  root: HTMLElement,
  config: {
    geometry: unknown;
    steps: DemoStep[];
    onReady?(): void;
    onMode?(mode: Exclude<HbmMode, 'sequence'>): void;
  },
): HbmEngine;
