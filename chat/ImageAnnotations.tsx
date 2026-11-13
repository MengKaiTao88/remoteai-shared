import { createContext, useContext, useLayoutEffect, useRef, type ReactNode } from 'react';
import type { ConnectionMode } from '../remote-chat/protocol';

interface AnnotationTarget {
  scope: string;
  add: (url: string) => void;
  focus: () => void;
  mode?: ConnectionMode;
}

const Context = createContext<{ current: AnnotationTarget | null } | null>(null);

/** Keep annotations attached to the composer in their owning workspace. */
export function ImageAnnotationsProvider({ children }: { children: ReactNode }) {
  const target = useRef<AnnotationTarget | null>(null);
  return <Context.Provider value={target}>{children}</Context.Provider>;
}

export const useImageAnnotationTarget = () => useContext(Context);

export function useComposerImageAnnotations(options: AnnotationTarget & { enabled: boolean }) {
  const target = useImageAnnotationTarget();
  useLayoutEffect(() => {
    if (!target || !options.enabled) return;
    target.current = options;
    return () => { if (target.current === options) target.current = null; };
  }, [target, options.scope, options.enabled, options.add, options.focus, options.mode]);
}
