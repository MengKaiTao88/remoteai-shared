import * as React from 'react';

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & { type?: 'button' };
const compatibilityClicks = new WeakMap<Document, () => void>();

/** Layout can move the original button before the browser dispatches its compatibility click. */
function suppressCompatibilityClick(document: Document) {
  compatibilityClicks.get(document)?.();
  const clear = () => {
    document.removeEventListener('click', click, true);
    document.removeEventListener('pointerdown', clear, true);
    clearTimeout(timer);
    compatibilityClicks.delete(document);
  };
  const click = (event: MouseEvent) => {
    if (!event.detail) return;
    event.preventDefault(); event.stopImmediatePropagation(); clear();
  };
  const timer = setTimeout(clear, 750);
  document.addEventListener('click', click, true);
  // The next deliberate pointer action is independent of the completed touch.
  document.addEventListener('pointerdown', clear, { capture: true, once: true });
  compatibilityClicks.set(document, clear);
}

/** Keep the editor focused without losing WebKit's touch action when pointer-down is cancelled. */
export const FocusPreservingButton = React.forwardRef<HTMLButtonElement, Props>(
  function FocusPreservingButton({ onClick, onPointerDown, onPointerUp, onPointerCancel, ...props }, ref) {
    const start = React.useRef<{ id: number; x: number; y: number }>();
    const handledTouch = React.useRef(false);
    return <button {...props} type="button" ref={ref} onPointerDown={event => {
      handledTouch.current = false;
      start.current = event.pointerType !== 'mouse'
        ? { id: event.pointerId, x: event.clientX, y: event.clientY } : undefined;
      onPointerDown?.(event);
      event.preventDefault();
    }} onPointerCancel={event => { handledTouch.current = !!start.current; start.current = undefined; onPointerCancel?.(event); }}
      onPointerUp={event => {
        onPointerUp?.(event);
        const origin = start.current;
        start.current = undefined;
        if (!origin || origin.id !== event.pointerId) return;
        handledTouch.current = true;
        event.preventDefault();
        suppressCompatibilityClick(event.currentTarget.ownerDocument);
        const box = event.currentTarget.getBoundingClientRect();
        if (props.disabled || Math.abs(event.clientX - origin.x) > 12 || Math.abs(event.clientY - origin.y) > 12
          || event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) return;
        onClick?.(event);
      }} onClick={event => {
        // Chromium may still synthesize click; keyboard/assistive activation has detail=0.
        if (handledTouch.current && event.detail !== 0) {
          handledTouch.current = false; event.preventDefault(); return;
        }
        if (!props.disabled) onClick?.(event);
      }} />;
  },
);
