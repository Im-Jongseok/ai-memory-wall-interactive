import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { PIM_GROUPS, PIM_STEPS } from './model';
const Context = createContext({ index: 0, setPlaying: (_playing: boolean) => {} });
/** Slides choose a group; only that group's demonstration plays automatically. */
export function PimStepProvider({
  index: group,
  visit,
  active,
  children,
}: {
  index: number;
  visit: string;
  active: boolean;
  children: ReactNode;
}) {
  const key = `${visit}/${group}`;
  const start = PIM_GROUPS[group].start;
  const [state, setState] = useState<{ key: string; index: number }>({ key, index: start });
  const [playing, updatePlaying] = useState(false);
  const setPlaying = useCallback((value: boolean) => updatePlaying(value), []);
  const index = state.key === key ? state.index : start;
  const remaining = useRef<{ key: string; index: number; left: number }>({
    key,
    index,
    left: PIM_STEPS[index].hold,
  });
  useLayoutEffect(() => {
    setState({ key, index: start });
    remaining.current = { key, index: start, left: PIM_STEPS[start].hold };
  }, [key, start]);
  useEffect(() => {
    if (!active) return;
    if (remaining.current.key !== key || remaining.current.index !== index) {
      remaining.current = { key, index, left: PIM_STEPS[index].hold };
    }
    if (!playing || index === PIM_GROUPS[group].end) return;
    const clock = remaining.current;
    const began = performance.now();
    const duration = clock.left;
    const timer = setTimeout(() => setState({ key, index: index + 1 }), duration);
    return () => {
      clearTimeout(timer);
      if (remaining.current === clock) {
        clock.left = Math.max(0, duration - (performance.now() - began));
      }
    };
  }, [active, group, key, index, playing]);
  return <Context.Provider value={{ index, setPlaying }}>{children}</Context.Provider>;
}
export const usePimStep = () => useContext(Context);
