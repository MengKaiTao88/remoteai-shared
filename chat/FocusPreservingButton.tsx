import * as React from 'react';

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & { type?: 'button' };

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
