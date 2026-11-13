import { useLayoutEffect, useMemo, useRef, useState } from 'react';

const ESTIMATED_ROW_HEIGHT = 44;
const EMPTY_HEIGHTS = new Map<string, number>();

/** Find the first boundary at or beyond a scroll position without scanning every file on scroll. */
function boundary(offsets: number[], position: number) {
  let start = 0;
  let end = offsets.length - 1;
  while (start < end) {
    const middle = Math.floor((start + end) / 2);
    if (offsets[middle] < position) start = middle + 1;
    else end = middle;
  }
  return start;
}

export function useGitVirtualList(keys: string[], fontSize: number) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [scrollTop, setScrollTop] = useState(0);
  const [cache, setCache] = useState({ width: 0, fontSize, heights: EMPTY_HEIGHTS });
  const measured = cache.width === size.width && cache.fontSize === fontSize ? cache.heights : EMPTY_HEIGHTS;
  const offsets = useMemo(() => {
    const result = [0];
    for (const key of keys) result.push(result[result.length - 1] + (measured.get(key) ?? ESTIMATED_ROW_HEIGHT));
    return result;
  }, [keys, measured]);
  const total = offsets[offsets.length - 1];
  const layout = useRef(total);
  layout.current = total;
  const top = Math.min(scrollTop, Math.max(0, total - size.height));
  const first = boundary(offsets, top);
  const start = offsets[first] === top ? first : Math.max(0, first - 1);
  const end = size.height > 0 ? boundary(offsets, top + size.height) : start;

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const resize = () => setSize(previous => {
      const next = { width: element.clientWidth, height: element.clientHeight };
      return next.width === previous.width && next.height === previous.height ? previous : next;
    });
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const element = viewport.current;
    if (element && element.scrollTop !== top) element.scrollTop = top;
    if (scrollTop !== top) setScrollTop(top);
  }, [top, scrollTop]);

  useLayoutEffect(() => {
    const rows = Array.from(content.current?.children ?? []) as HTMLElement[];
    let previous = measured;
    const measure = () => {
      const next = new Map(previous);
      let difference = 0;
      let changed = false;
      for (const row of rows) {
        const height = row.getBoundingClientRect().height;
        const key = row.dataset.gitRowKey!;
        if (height <= 0 || next.get(key) === height) continue;
        difference += height - (next.get(key) ?? ESTIMATED_ROW_HEIGHT);
        next.set(key, height); changed = true;
      }
      if (!changed) return;
      const element = viewport.current;
      // Newly measured content can already overflow the old spacer, so use its previous logical height.
      if (element && element.scrollTop > 0 && element.scrollTop + element.clientHeight >= layout.current - 1) {
        setScrollTop(top => top + difference);
      }
      previous = next;
      setCache({ width: size.width, fontSize, heights: next });
    };
    measure();
    const observer = new ResizeObserver(measure);
    rows.forEach(row => observer.observe(row));
    return () => observer.disconnect();
  }, [keys, start, end, size.width, fontSize]);

  return { viewport, content, start, end, total, before: offsets[start], scroll: setScrollTop };
}
