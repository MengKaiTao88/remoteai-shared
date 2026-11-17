// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { FocusPreservingButton } from './FocusPreservingButton';

afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); });
function fixture(disabled = false) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  const action = vi.fn();
  act(() => root.render(React.createElement(FocusPreservingButton, { disabled, onClick: action }, 'Action')));
  const button = host.querySelector('button')!;
  button.getBoundingClientRect = () => ({ left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40, x: 0, y: 0, toJSON() {} });
  const pointer = (type: string, pointerType = 'touch', clientX = 20) => {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY: 20 });
    Object.defineProperties(event, { pointerType: { value: pointerType }, pointerId: { value: 1 } });
    act(() => button.dispatchEvent(event)); return event;
  };
  const click = (detail: number) => act(() => button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail })));
  return { action, pointer, click, dispose: () => act(() => root.unmount()) };
}
it('retains focus and handles a touch once, with or without a synthesized click', () => {
  const value = fixture();
  expect(value.pointer('pointerdown').defaultPrevented).toBe(true);
  value.pointer('pointerup'); expect(value.action).toHaveBeenCalledTimes(1);
  value.click(1); expect(value.action).toHaveBeenCalledTimes(1);
  value.click(0); expect(value.action).toHaveBeenCalledTimes(2);
  value.dispose();
});
it('keeps ordinary mouse activation on click and keyboard activation independent', () => {
  const value = fixture();
  value.pointer('pointerdown', 'mouse'); value.pointer('pointerup', 'mouse');
  expect(value.action).not.toHaveBeenCalled();
  value.click(1); value.click(0); expect(value.action).toHaveBeenCalledTimes(2);
  value.dispose();
});
it('does not activate canceled, moved, outside or disabled touch presses', () => {
  const value = fixture();
  value.pointer('pointerdown'); value.pointer('pointercancel'); value.pointer('pointerup'); value.click(1);
  value.pointer('pointerdown'); value.pointer('pointerup', 'touch', 80); value.click(1);
  expect(value.action).not.toHaveBeenCalled(); value.dispose();
  const disabled = fixture(true);
  disabled.pointer('pointerdown'); disabled.pointer('pointerup'); disabled.click(1);
  expect(disabled.action).not.toHaveBeenCalled(); disabled.dispose();
});
it('blocks the compatibility click even if a layout change retargets it to another control', () => {
  const value = fixture();
  const other = document.createElement('button'); document.body.append(other);
  const unintended = vi.fn(); other.addEventListener('click', unintended);
  value.pointer('pointerdown'); value.pointer('pointerup');
  other.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
  expect(value.action).toHaveBeenCalledTimes(1);
  expect(unintended).not.toHaveBeenCalled();
  other.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
  other.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
  expect(unintended).toHaveBeenCalledTimes(1);
  value.dispose();
});
