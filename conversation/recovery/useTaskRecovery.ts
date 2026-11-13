import { useCallback, useEffect, useRef, useState } from 'react';
import { RECOVERY_EVENT, type RecoveryClient, type RecoveryResult, type RecoverySnapshot } from './types';

/** Every UI reads the host journal. Reloads and reconnects never create new recovery decisions. */
export function useTaskRecovery(client: RecoveryClient, enabled: boolean) {
  const [snapshot, setSnapshot] = useState<RecoverySnapshot>();
  const [failure, setFailure] = useState<RecoveryResult>();
  const [readFailed, setReadFailed] = useState(false);
  const generation = useRef(0);
  const current = useRef<RecoverySnapshot>();
  const deciding = useRef(false);

  useEffect(() => {
    const version = ++generation.current;
    deciding.current = false;
    current.current = undefined;
    setSnapshot(undefined);
    setFailure(undefined);
    setReadFailed(false);
    if (!enabled) return;
    let stopped = false;
    let pending = false;
    let dirty = false;
    let unsubscribe: (() => void) | undefined;
    const refresh = async () => {
      if (stopped) return;
      if (pending) { dirty = true; return; }
      pending = true;
      try {
        const next = await client.read();
        if (stopped || generation.current !== version) return;
        current.current = next;
        setSnapshot(next);
        setReadFailed(false);
      } catch {
        if (!stopped) setReadFailed(true);
      } finally {
        pending = false;
        if (dirty) { dirty = false; void refresh(); }
      }
    };
    void Promise.resolve(client.subscribe(event => {
      if (event.method === RECOVERY_EVENT || (['turn/started', 'turn/completed', 'thread/deleted', 'thread/archived']
        .includes(event.method) && current.current?.candidates.some(item => item.entry.threadId === event.params.threadId))) {
        void refresh();
      }
    })).then(stop => {
      if (stopped) stop();
      else { unsubscribe = stop; void refresh(); }
    }).catch(() => { if (!stopped) setReadFailed(true); });
    return () => { stopped = true; unsubscribe?.(); generation.current += 1; };
  }, [client, enabled]);

  const decide = useCallback(async (action: 'resume' | 'dismiss') => {
    const selected = current.current;
    if (!selected?.candidates.length || deciding.current) return;
    deciding.current = true;
    const version = generation.current;
    setSnapshot(undefined);
    try {
      const result = await client.decide(selected, action);
      if (generation.current === version && result.failed.length) setFailure(result);
    } catch {
      if (generation.current === version) setFailure({ failed: selected.candidates.map(item => ({
        threadId: item.entry.threadId, title: item.title,
      })) });
    } finally {
      if (generation.current === version) deciding.current = false;
    }
  }, [client]);

  const clearFailure = useCallback(() => setFailure(undefined), []);
  const clearReadFailure = useCallback(() => setReadFailed(false), []);
  return { snapshot, failure, readFailed, decide, clearFailure, clearReadFailure };
}
