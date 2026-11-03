import type { ReactNode, RefObject } from 'react';
export function PresentationLayout({
  rootRef,
  className,
  source,
  explanation,
  controls,
  overlays,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  className: string;
  source: ReactNode;
  explanation: ReactNode;
  controls: ReactNode;
  overlays: ReactNode;
}) {
  return (
    <div
      ref={rootRef}
      className={`presentation-root ${className}`}
      tabIndex={-1}
      onPointerDown={(event) => {
        const target = event.target;
        if (
          target instanceof Element &&
          !target.closest('button, a, input, textarea, select, [contenteditable], dialog')
        ) {
          event.currentTarget.focus({ preventScroll: true });
        }
      }}
    >
      <main id="app">
        <section id="reader" className="reader">
          <div className="reading-layout">
            <div className="source-column">{source}</div>
            {explanation}
          </div>
        </section>
      </main>
      {controls}
      {overlays}
    </div>
  );
}
