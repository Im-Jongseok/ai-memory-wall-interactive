import type { PaperDefinition, PaperScene } from '../../papers/types';
export interface PaperEngine {
  render(scene: PaperScene, freePage?: number | null): void;
  suspend(): void;
  toggleOverview(): void;
  zoom(factor: number, anchor?: { x: number; y: number }): void;
  fit(): void;
  resize(): void;
  dispose(): void;
}
export function createPaperEngine(
  stage: HTMLDivElement,
  paper: PaperDefinition,
  callbacks: {
    onNavigate(id: string): void;
    onError(message: string): void;
    onSettled?(): void;
  },
): PaperEngine;
