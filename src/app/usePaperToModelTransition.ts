import { useCallback, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

/** Hold the captured paper until the first model frame (or fallback) is painted. */
export function usePaperToModelTransition() {
  const pending = useRef<{
    transition: ViewTransition;
    release(): void;
    timeout: ReturnType<typeof setTimeout>;
  } | null>(null);
  const clear = useCallback(() => {
    const current = pending.current;
    if (!current) return false;
    pending.current = null;
    clearTimeout(current.timeout);
    current.release();
    current.transition.skipTransition();
    delete document.documentElement.dataset.paperToModel;
    return true;
  }, []);
  useEffect(
    () => () => {
      clear();
    },
    [clear],
  );
  const reveal = useCallback(() => {
    const current = pending.current;
    if (current) {
      clearTimeout(current.timeout);
      current.release();
    }
  }, []);
  const start = useCallback(
    (commit: () => void) => {
      clear();
      if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        commit();
        return;
      }
      let release!: () => void;
      const ready = new Promise<void>((resolve) => {
        release = resolve;
      });
      document.documentElement.dataset.paperToModel = 'true';
      const transition = document.startViewTransition(async () => {
        if (pending.current?.transition !== transition) return;
        flushSync(commit);
        await ready;
      });
      const current = { transition, release, timeout: setTimeout(release, 4000) };
      pending.current = current;
      void transition.ready.catch(() => {});
      void transition.finished
        .catch(() => {})
        .finally(() => {
          clearTimeout(current.timeout);
          if (pending.current === current) {
            pending.current = null;
            delete document.documentElement.dataset.paperToModel;
          }
        });
    },
    [clear],
  );
  return { start, reveal, clear };
}
