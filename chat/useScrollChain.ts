import { useEffect, useRef } from 'react';

const NORMAL_LINE_HEIGHT = 1.2;

function scrollContainers(target: EventTarget | null) {
  const containers: { node: HTMLElement; style: CSSStyleDeclaration }[] = [];
  let node = target instanceof HTMLElement ? target : target instanceof Element ? target.parentElement : null;
  while (node) {
    const style = getComputedStyle(node);
    if (/^(auto|scroll)$/.test(style.overflowY)) {
      containers.push({ node, style });
      if (style.overscrollBehaviorY === 'contain' || style.overscrollBehaviorY === 'none') break;
    }
    node = node.parentElement;
  }
  return containers;
}

function wheelPixels(event: WheelEvent, first: { node: HTMLElement; style: CSSStyleDeclaration }) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * first.node.clientHeight;
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    const lineHeight = parseFloat(first.style.lineHeight)
      || parseFloat(first.style.fontSize) * NORMAL_LINE_HEIGHT;
    return event.deltaY * lineHeight;
  }
  return event.deltaY;
}

function shouldChainWheel(event: WheelEvent) {
  return event.cancelable && !event.defaultPrevented && !event.ctrlKey && !event.metaKey && !event.shiftKey
    && event.deltaY !== 0 && Math.abs(event.deltaX) <= Math.abs(event.deltaY);
}

function scrollWheel(event: WheelEvent) {
  if (!shouldChainWheel(event)) return;
  const containers = scrollContainers(event.target);
  if (!containers.length) return;
  const delta = wheelPixels(event, containers[0]);
  let remaining = delta;
  for (const { node } of containers) {
    const before = node.scrollTop;
    const limit = Math.max(0, node.scrollHeight - node.clientHeight);
    node.scrollTop = Math.max(0, Math.min(limit, before + remaining));
    remaining -= node.scrollTop - before;
    if (remaining === 0) break;
  }
  // Consume each delta once, including its remainder, without Chromium's wheel-gesture latching.
  // At the outer boundary leave the event available for history pagination.
  if (remaining !== delta) event.preventDefault();
}

/** Let command output and activity lists hand wheel movement through every ancestor in the same gesture. */
export function useScrollChain<T extends HTMLElement>(active = true) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const node = ref.current;
    if (!active || !node) return;
    node.addEventListener('wheel', scrollWheel, { passive: false });
    return () => node.removeEventListener('wheel', scrollWheel);
  }, [active]);
  return ref;
}
