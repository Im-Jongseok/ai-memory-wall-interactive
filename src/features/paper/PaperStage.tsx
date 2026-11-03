import { forwardRef } from 'react';
export const PaperStage = forwardRef<HTMLDivElement, { hidden: boolean }>(function PaperStage(
  { hidden },
  ref,
) {
  return (
    <div
      id="stage"
      ref={ref}
      className="stage"
      hidden={hidden}
      tabIndex={0}
      aria-label="논문 원문. 휠과 드래그로 이동하고 Ctrl+휠로 확대할 수 있습니다."
    >
      <div id="paper" className="paper">
        <img id="paper-image" className="context-image" draggable={false} alt="" />
        <img id="focus-image" className="focus-image" draggable={false} alt="" aria-hidden="true" />
        <svg
          id="key-emphasis"
          className="key-emphasis"
          viewBox="0 0 1000 1365"
          preserveAspectRatio="none"
          aria-hidden="true"
        />
        <div id="hotspots" className="hotspots" />
        <div id="focus-ring" className="focus-ring" aria-hidden="true" />
      </div>
    </div>
  );
});
