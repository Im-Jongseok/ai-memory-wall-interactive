import { useEffect, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { CerebrasMode } from './context';
export interface CerebrasLayers {
  wafer: RefObject<SVGGElement | null>;
  core: RefObject<SVGGElement | null>;
  stack: RefObject<SVGGElement | null>;
  memory: RefObject<SVGGElement | null>;
  links: RefObject<SVGGElement | null>;
}
const IDENTITY = 'matrix(1,0,0,1,0,0)';
const place = (scale: number, from: readonly number[], to: readonly number[]) =>
  `matrix(${scale},0,0,${scale},${to[0] - scale * from[0]},${to[1] - scale * from[1]})`;
/** Camera transforms + a separated memory layer; no React render on animation frames. */
export function useCerebrasMotion(
  mode: CerebrasMode,
  layers: CerebrasLayers,
  hotspot: readonly number[],
  stackHotspot: readonly number[],
  lift: number,
  running: boolean,
  reduced: boolean,
) {
  const previous = useRef<CerebrasMode | null>(null),
    animations = useRef<Animation[]>([]);
  // The refs/geometry are stable for a mounted model; a new mode is the only transition trigger.
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = mode;
    const elements = {
      wafer: layers.wafer.current!,
      core: layers.core.current!,
      stack: layers.stack.current!,
    };
    const snapshots = Object.fromEntries(
      Object.entries(elements).map(([key, node]) => {
        const css = getComputedStyle(node);
        return [
          key,
          { opacity: css.opacity, transform: css.transform === 'none' ? IDENTITY : css.transform },
        ];
      }),
    ) as Record<CerebrasMode, { opacity: string; transform: string }>;
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
    Object.values(elements).forEach((node) => {
      node.style.opacity = '0';
      node.style.transform = IDENTITY;
    });
    if (!before || reduced) {
      elements[mode].style.opacity = '1';
      if (layers.memory.current) layers.memory.current.style.transform = IDENTITY;
      if (layers.links.current) layers.links.current.style.opacity = '1';
      return;
    }
    if (before === mode) {
      elements[mode].style.opacity = '1';
      return;
    }
    const duration = mode === 'stack' ? 1100 : mode === 'core' ? 900 : 800;
    const animate = (node: Element, frames: Keyframe[]) => {
      const animation = node.animate(frames, {
        duration,
        easing: 'cubic-bezier(.22,.65,.26,1)',
        fill: 'both',
      });
      if (!running) animation.pause();
      animations.current.push(animation);
    };
    const zoomToTile = place(3.4, hotspot, [380, 270]);
    const coreIntoTile = place(0.15, [380, 270], mode === 'stack' ? stackHotspot : hotspot);
    for (const key of ['wafer', 'core', 'stack'] as const) {
      if (key === mode) continue;
      const start = snapshots[key];
      if (Number(start.opacity) < 0.001) continue;
      const end =
        key === 'wafer' && mode === 'core'
          ? zoomToTile
          : key === 'core'
            ? coreIntoTile
            : place(0.92, [380, 275], [380, 275]);
      animate(elements[key], [
        { ...start, offset: 0 },
        { transform: end, opacity: 0, offset: 1 },
      ]);
    }
    const current = snapshots[mode];
    if (Number(current.opacity) > 0.001)
      animate(elements[mode], [
        { ...current, offset: 0 },
        { transform: IDENTITY, opacity: 1, offset: 1 },
      ]);
    else if (mode === 'core')
      animate(elements.core, [
        { transform: place(0.15, [380, 270], hotspot), opacity: 0, offset: 0 },
        { transform: place(0.4, [380, 270], [380, 270]), opacity: 0.15, offset: 0.45 },
        { transform: IDENTITY, opacity: 1, offset: 1 },
      ]);
    else if (mode === 'wafer')
      animate(elements.wafer, [
        { transform: zoomToTile, opacity: 0, offset: 0 },
        { transform: IDENTITY, opacity: 1, offset: 1 },
      ]);
    else
      animate(elements.stack, [
        { transform: place(0.95, [380, 275], [380, 285]), opacity: 0, offset: 0 },
        { transform: IDENTITY, opacity: 1, offset: 0.75 },
        { transform: IDENTITY, opacity: 1, offset: 1 },
      ]);
    if (mode === 'stack' && layers.memory.current && layers.links.current) {
      animate(layers.memory.current, [
        { transform: `translateY(${lift}px)`, offset: 0 },
        { transform: `translateY(${lift}px)`, offset: 0.25 },
        { transform: IDENTITY, offset: 1 },
      ]);
      animate(layers.links.current, [
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: 0.7 },
        { opacity: 1, offset: 1 },
      ]);
    }
  }, [mode, reduced]);
  useEffect(() => {
    animations.current.forEach((animation) => {
      if (animation.playState === 'finished' || animation.playState === 'idle') return;
      if (running) animation.play();
      else animation.pause();
    });
  }, [running]);
  useEffect(
    () => () => {
      animations.current.forEach((animation) => animation.cancel());
    },
    [],
  );
}
