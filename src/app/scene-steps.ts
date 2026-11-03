import type { ReviewScene } from '../papers/types';
import { PIM_GROUPS } from '../features/industry/pim/model';
export const CEREBRAS_MODES = ['wafer', 'core', 'stack'] as const;
export const CXMT_MODES = ['baseline', 'compact', 'array', 'density'] as const;
export function sceneStepCount(scene: ReviewScene) {
  if (scene.kind === 'hbm') return scene.problems?.length || 1;
  if (scene.kind !== 'industry') return 1;
  return scene.topic === 'pim'
    ? PIM_GROUPS.length
    : scene.topic === 'cxmt'
      ? CXMT_MODES.length
      : CEREBRAS_MODES.length;
}
