import { useEffect, useRef, type RefObject } from 'react';
import type { ImageNavigation } from './ImageGallery';

/** The active preview keeps its shortcuts when closing an editor form leaves focus on the body. */
export function useImageNavigationKeys(dialog: RefObject<HTMLDialogElement>, navigation?: ImageNavigation) {
  const latest = useRef(navigation);
  latest.current = navigation;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const actions = latest.current;
      if (!actions || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable], [role="textbox"]')) {
        return;
      }
      const openDialogs = document.querySelectorAll('dialog[open]');
      if (openDialogs[openDialogs.length - 1] !== dialog.current) return;
      event.preventDefault();
      event.stopPropagation();
      const action = event.key === 'ArrowLeft' ? actions.previous : actions.next;
      action?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dialog]);
}
