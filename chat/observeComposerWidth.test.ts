import { afterEach, expect, it, vi } from 'vitest';
import { observeComposerWidth } from './observeComposerWidth';

afterEach(() => vi.unstubAllGlobals());
function fixture() {
  let width = 240;
  let notify = () => {};
  let nextId = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const disconnect = vi.fn();
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { notify = callback; }
    observe() {}
    disconnect = disconnect;
  });
  const schedule = vi.fn((callback: FrameRequestCallback) => { frames.set(++nextId, callback); return nextId; });
  vi.stubGlobal('requestAnimationFrame', schedule);
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  const resize = vi.fn();
  const dispose = observeComposerWidth({ get clientWidth() { return width; } } as HTMLTextAreaElement, resize);
  return { resize, schedule, disconnect, dispose, notify: () => notify(), setWidth: (value: number) => { width = value; },
    flush: () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(0)); } };
}
it('never writes input geometry inside ResizeObserver delivery and coalesces changes per frame', () => {
  const value = fixture();
  value.notify();
  expect(value.schedule).not.toHaveBeenCalled();
  value.setWidth(320); value.notify();
  value.setWidth(360); value.notify();
  expect(value.resize).not.toHaveBeenCalled();
  expect(value.schedule).toHaveBeenCalledTimes(1);
  value.flush();
  expect(value.resize).toHaveBeenCalledTimes(1);
  value.notify();
  expect(value.schedule).toHaveBeenCalledTimes(1);
  value.dispose();
});
it('cancels pending geometry writes when the composer unmounts or becomes inactive', () => {
  const value = fixture();
  value.setWidth(320); value.notify();
  value.dispose(); value.flush();
  expect(value.disconnect).toHaveBeenCalledOnce();
  expect(value.resize).not.toHaveBeenCalled();
});
