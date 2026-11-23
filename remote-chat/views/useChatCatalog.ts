import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { SkillCatalog } from '../../chat/skillCatalog';
import type { ChatController } from './types';

export function useChatCatalog(controller: ChatController, cwd: string, ready: boolean, threadId?: string) {
  // Keep catalogs within this connection; another account or computer gets a fresh instance.
  const catalog = useMemo(() => {
    let cached: unknown = null;
    return new SkillCatalog({ peek: () => undefined, read: async () => cached,
      write: async skills => { cached = skills; } });
  }, [controller, cwd, threadId]);
  const state = useSyncExternalStore(catalog.subscribe, catalog.snapshot);
  const refresh = useCallback(() => {
    if (ready) void catalog.refresh(() => controller.loadSkills(cwd, threadId));
  }, [catalog, controller, cwd, ready, threadId]);
  useEffect(refresh, [refresh]);
  return { ...state, refresh };
}
