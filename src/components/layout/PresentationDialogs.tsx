import { forwardRef } from 'react';
import type { MouseEvent } from 'react';
import type { PaperDefinition } from '../../papers/types';
import { assetUrl } from '../../app/assets';
function backdropClick(event: MouseEvent<HTMLDialogElement>) {
  const dialog = event.currentTarget;
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (
    event.clientX < r.left ||
    event.clientX > r.right ||
    event.clientY < r.top ||
    event.clientY > r.bottom
  )
    dialog.close();
}
export const PageExplorer = forwardRef<
  HTMLDialogElement,
  { paper: PaperDefinition; onSelect(page: number): void }
>(function PageExplorer({ paper, onSelect }, ref) {
  return (
    <dialog ref={ref} id="page-dialog" className="page-dialog" onClick={backdropClick}>
      <div className="dialog-top">
        <h2>원문 페이지 탐색</h2>
        <button
          className="dialog-close icon-button"
          aria-label="닫기"
          onClick={(e) => e.currentTarget.closest('dialog')?.close()}
        >
          ×
        </button>
      </div>
      <div id="explorer-pages" className="page-grid">
        {paper.pages.map((page) => (
          <button
            key={page.id}
            className="page-card"
            data-page={page.id}
            aria-label={`원문 ${page.printedPage}쪽: ${page.title.replace(/\n/g, ' ')}`}
            onClick={(e) => {
              e.currentTarget.closest('dialog')?.close();
              onSelect(page.id);
            }}
          >
            <small>
              <span>p.{page.printedPage}</span>
              <span>↗</span>
            </small>
            <span className="page-thumb">
              <img
                src={assetUrl(page.thumbnail)}
                alt={`원문 ${page.printedPage}쪽`}
                loading="lazy"
              />
            </span>
            <strong>{page.title}</strong>
          </button>
        ))}
      </div>
    </dialog>
  );
});
const shortcuts = [
  ['이전 / 다음 설명·장면', '← / →'],
  ['다음 설명·장면', 'Space'],
  ['전체 페이지 ↔ 확대', 'O'],
  ['원문만 크게 보기', 'T'],
  ['발표자 노트', 'N'],
  ['원문 페이지 탐색', 'M'],
  ['논문 목록', 'L'],
  ['전체 화면', 'F'],
  ['처음 / 끝', 'Home / End'],
];
export const HelpDialog = forwardRef<HTMLDialogElement>(function HelpDialog(_, ref) {
  return (
    <dialog ref={ref} id="help-dialog" className="help-dialog" onClick={backdropClick}>
      <div className="dialog-top">
        <h2>발표 단축키</h2>
        <button
          className="dialog-close icon-button"
          aria-label="닫기"
          onClick={(e) => e.currentTarget.closest('dialog')?.close()}
        >
          ×
        </button>
      </div>
      <div className="shortcut-list">
        {shortcuts.map(([label, key]) => (
          <p key={key}>
            <span>{label}</span>
            <kbd>{key}</kbd>
          </p>
        ))}
      </div>
      <p className="help-bottom">
        휠·드래그로 이동하고 Ctrl+휠로 확대하세요.
        <br />
        숫자 0은 현재 장면에 맞추고, O는 전체 원문으로 돌아갑니다.
      </p>
    </dialog>
  );
});
