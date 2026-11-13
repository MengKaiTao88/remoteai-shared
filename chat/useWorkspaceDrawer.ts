import { useCallback, useMemo, useRef, useState } from 'react';
import type { WorkspaceTab, WorkspaceTabs } from './workspaceDrawer';

export function useWorkspaceDrawer(active: boolean) {
  const [entries, setEntries] = useState<WorkspaceTab[]>([]);
  const [selected, select] = useState<string | null>(null);
  const [closed, setClosed] = useState<ReadonlySet<string>>(() => new Set());
  const [display, setDisplay] = useState<'open' | 'closed' | 'minimized'>('closed');
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const register = useCallback((tab: WorkspaceTab) => {
    setEntries(current => [...current.filter(entry => entry.id !== tab.id), tab]);
    return () => setEntries(current => current.filter(entry => entry.id !== tab.id));
  }, []);
  const rememberOpener = useCallback(() => {
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && !focused.closest('[data-details-panel]')) opener.current = focused;
  }, []);
  const open = useCallback((id: string) => {
    rememberOpener();
    setClosed(current => {
      if (!current.has(id)) return current;
      const next = new Set(current); next.delete(id); return next;
    });
    select(id); setDisplay('open');
  }, [rememberOpener]);
  const hide = useCallback(() => { setDisplay('closed'); opener.current?.focus(); }, []);
  const closeMany = useCallback((ids: string[], order: string[]) => {
    if (!ids.length) return selected;
    // Keep registered panels mounted so closing a workspace tab never discards its drafts.
    const closing = new Set(ids);
    setClosed(current => new Set([...current, ...closing]));
    if (!selected || !closing.has(selected)) return selected;
    const index = order.indexOf(selected);
    const next = order.slice(index + 1).find(id => !closing.has(id))
      ?? order.slice(0, index).reverse().find(id => !closing.has(id)) ?? null;
    select(next);
    if (!next) hide();
    return next;
  }, [selected, hide]);
  const close = useCallback((id: string, order: string[]) => closeMany([id], order), [closeMany]);
  const minimize = useCallback(() => { setDisplay('minimized'); opener.current?.focus(); }, []);
  const visible = active && display === 'open';
  const tabs = useMemo<WorkspaceTabs>(() => ({
    entries, selected, closed, visible, content, register, open, close, closeMany, hide, rememberOpener,
  }), [entries, selected, closed, visible, content, register, open, close, closeMany, hide, rememberOpener]);
  return { tabs, setContent, minimize, minimized: display === 'minimized',
    restore: () => setDisplay('open') };
}
