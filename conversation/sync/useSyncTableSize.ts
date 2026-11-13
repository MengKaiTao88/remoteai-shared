import { useLayoutEffect, useRef, useState } from 'react';

const MIN_BODY_HEIGHT = 1;

export function useSyncTableSize() {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1, height: MIN_BODY_HEIGHT });
  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const header = element.querySelector('.ant-table-thead');
    const measure = () => {
      const width = element.clientWidth;
      const height = Math.max(MIN_BODY_HEIGHT, element.clientHeight - (header?.getBoundingClientRect().height ?? 0));
      setSize(current => current.width === width && current.height === height ? current : { width, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (header) observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return { container, size };
}
