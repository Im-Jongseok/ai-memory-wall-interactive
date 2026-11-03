import type { PaperDefinition, Region } from './types';
/** Cross-field content errors cannot be detected by TypeScript's structural types. */
export function validatePapers(papers: PaperDefinition[]): void {
  const paperIds = new Set<string>();
  for (const paper of papers) {
    const fail = (message: string): never => {
      throw new Error(`[${paper.id}] ${message}`);
    };
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(paper.id) || paperIds.has(paper.id))
      fail('논문 ID가 잘못되었거나 중복되었습니다.');
    paperIds.add(paper.id);
    if (!paper.pages.length || !paper.scenes.length) fail('페이지와 발표 장면을 등록하세요.');
    if (paper.pageSize.width <= 0 || paper.pageSize.height <= 0)
      fail('원문 페이지 크기는 양수여야 합니다.');
    const pages = new Set(paper.pages.map((p) => p.id));
    const scenes = new Set(paper.scenes.map((s) => s.id));
    if (pages.size !== paper.pages.length || scenes.size !== paper.scenes.length)
      fail('페이지 또는 장면 ID가 중복되었습니다.');
    const checkRegion = (rect: Region | null | undefined, id: string) => {
      if (!rect) return;
      if (
        !rect.every((n) => Number.isFinite(n) && n >= 0 && n <= 1) ||
        rect[0] >= rect[2] ||
        rect[1] >= rect[3]
      )
        fail(`${id}의 강조 좌표를 확인하세요.`);
    };
    for (const scene of paper.scenes) {
      if (scene.kind === 'paper') {
        if (!pages.has(scene.page))
          fail(`${scene.id}에 연결된 원문 페이지 ${scene.page}가 없습니다.`);
        checkRegion(scene.roi, scene.id);
        checkRegion(scene.highlight, scene.id);
        scene.emphasis?.forEach((mark) => checkRegion(mark.rect, scene.id));
      } else if (scene.kind === 'hbm' && !paper.features?.hbm)
        fail(`${scene.id}에 필요한 HBM 기능 설정이 없습니다.`);
    }
    for (const [alias, destination] of Object.entries(paper.aliases ?? {})) {
      if (!scenes.has(destination)) fail(`${alias} 별칭의 목적 장면 ${destination}이 없습니다.`);
    }
  }
}
