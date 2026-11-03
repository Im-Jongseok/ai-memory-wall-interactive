import type { PaperDefinition } from '../papers/types';
import { availablePapers, defaultPaper } from '../papers/registry';
export type Route =
  { kind: 'library' } | { kind: 'paper'; paper: PaperDefinition; sceneId: string };
export function readRoute(): Route {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash === 'library') return { kind: 'library' };
  const [, paperId, requestedScene] = hash.match(/^papers\/([^/]+)(?:\/(.*))?$/) ?? [];
  const list = availablePapers();
  const selected = paperId
    ? list.find((p) => p.id === paperId)
    : (list.find((p) => p.id === defaultPaper.id) ?? list[0]);
  if (!selected) return { kind: 'library' };
  const id = requestedScene ?? (paperId ? '' : hash);
  const sceneId = selected.aliases?.[id] ?? id;
  return {
    kind: 'paper',
    paper: selected,
    sceneId: selected.scenes.find((s) => s.id === sceneId)?.id ?? selected.scenes[0].id,
  };
}
export function sceneHash(paper: PaperDefinition, sceneId: string): string {
  return paper.id === defaultPaper.id ? `#${sceneId}` : `#papers/${paper.id}/${sceneId}`;
}
