function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === 'left' ? 'M19 12H5m7-7-7 7 7 7' : 'M5 12h14m-7-7 7 7-7 7'} />
    </svg>
  );
}
export function PresentationControls({
  first,
  last,
  onStep,
  onFullscreen,
}: {
  first: boolean;
  last: boolean;
  onStep(direction: number): void;
  onFullscreen(): void;
}) {
  return (
    <>
      <button
        id="fullscreen-btn"
        className="fullscreen-button"
        onClick={onFullscreen}
        aria-label="전체 화면 (F)"
        title="전체 화면 (F)"
      >
        ⛶
      </button>
      <footer className="presentation-controls">
        <button
          id="prev-btn"
          className="navigation-button"
          disabled={first}
          onClick={() => onStep(-1)}
          aria-label="이전 장면 (왼쪽 화살표)"
        >
          <Arrow direction="left" />
        </button>
        <button
          id="next-btn"
          className="navigation-button"
          disabled={last}
          onClick={() => onStep(1)}
          aria-label="다음 장면 (오른쪽 화살표)"
        >
          <Arrow direction="right" />
        </button>
      </footer>
    </>
  );
}
