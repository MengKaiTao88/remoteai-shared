import { useRef } from 'react';

/** Keep a new draft's cache identity after creation; send and queue scopes remain unchanged. */
export function useDraftCacheScope({ threadId, draftScope }: {
  threadId: string | null; draftScope?: string | null;
}) {
  const aliases = useRef(new Map<string, string>());
  if (!threadId) return draftScope ?? null;
  let key = aliases.current.get(threadId);
  if (key === undefined) {
    key = draftScope ?? threadId;
    aliases.current.set(threadId, key);
  }
  return key;
}
