/** Resize in a new frame, never while ResizeObserver is delivering layout notifications. */
export function observeComposerWidth(input: HTMLTextAreaElement, resize: () => void) {
  let width = input.clientWidth;
  let frame = 0;
  const observer = new ResizeObserver(() => {
    if (input.clientWidth === width) return;
    width = input.clientWidth;
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; resize(); });
  });
  observer.observe(input);
  return () => { observer.disconnect(); if (frame) cancelAnimationFrame(frame); };
}
