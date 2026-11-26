import { useCallback, useLayoutEffect, useRef } from "react";

type SlidingThumbOptions = {
  axis: "inline" | "block";
  itemCount: number;
  selectedIndex: number;
  roundEnds?: boolean;
  pressScale?: number;
  enabled?: boolean;
};

export function useSlidingThumb<
  TTrack extends HTMLElement,
  TItem extends HTMLElement,
>({ axis, itemCount, selectedIndex, enabled = true }: SlidingThumbOptions) {
  const trackRef = useRef<TTrack>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const items = useRef<Array<TItem | null>>([]);

  const positionThumb = useCallback(() => {
    if (!enabled) return;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    const item = items.current[selectedIndex];
    if (!track || !thumb || !item) return;
    const trackBox = track.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    thumb.style.width = `${itemBox.width}px`;
    thumb.style.height = `${itemBox.height}px`;
    thumb.style.transform = `translate(${itemBox.left - trackBox.left}px, ${itemBox.top - trackBox.top}px)`;
  }, [enabled, selectedIndex]);

  useLayoutEffect(() => {
    positionThumb();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", positionThumb);
      return () => window.removeEventListener("resize", positionThumb);
    }
    const observer = new ResizeObserver(positionThumb);
    if (trackRef.current) observer.observe(trackRef.current);
    return () => observer.disconnect();
  }, [axis, itemCount, positionThumb]);

  const registerItem = useCallback(
    (index: number) => (node: TItem | null) => {
      items.current[index] = node;
    },
    [],
  );

  return {
    trackRef,
    thumbRef,
    registerItem,
    onPointerDown: undefined,
  };
}
