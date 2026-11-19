/** Detect whether a nested overflow region can still consume this vertical scroll. */
export function canScrollWithin(target: EventTarget, viewport: HTMLElement, delta: number) {
  let node = target instanceof Element ? target : null;
  while (node && node !== viewport) {
    if (/^(auto|scroll|overlay)$/.test(getComputedStyle(node).overflowY)) {
      const bottom = node.scrollHeight - node.clientHeight;
      if (bottom > 1 && (delta < 0 ? node.scrollTop > 1 : bottom - node.scrollTop > 1)) return true;
    }
    node = node.parentElement;
  }
  return false;
}
