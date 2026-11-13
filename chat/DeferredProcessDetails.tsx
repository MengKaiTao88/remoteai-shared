import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { guiApi } from '../conversation/api';
import type { Item } from '../conversation/types';
import { uiText } from '../localization/uiText';

export type ProcessDetailsLoader = (target: NonNullable<Item['processRef']>) => Promise<{ items: Item[] }>;
export const ProcessDetailsContext = createContext<{ load: ProcessDetailsLoader; active: boolean }>({
  load: target => guiApi.request({ operation: 'processDetails', ...target }), active: true,
});
const requests = new WeakMap<ProcessDetailsLoader, Map<string, Promise<Item[]>>>();

function read(load: ProcessDetailsLoader, target: NonNullable<Item['processRef']>) {
  const pending = requests.get(load) ?? new Map<string, Promise<Item[]>>();
  requests.set(load, pending);
  const key = JSON.stringify(target);
  const previous = pending.get(key);
  if (previous) return previous;
  const result = load(target).then(response => response.items).finally(() => pending.delete(key));
  pending.set(key, result);
  return result;
}

function LoadedProcess({ items, active, children }: {
  items: Item[]; active: boolean; children: (items: Item[]) => ReactNode;
}) {
  const context = useContext(ProcessDetailsContext);
  const [loaded, setLoaded] = useState<Item[]>();
  const [error, setError] = useState(false);
  const [attempt, retry] = useState(0);
  const currentItems = useRef(items);
  currentItems.current = items;
  const key = JSON.stringify(items.map(item => item.processRef ?? item.id));
  useEffect(() => {
    if (!active || !context.active) return;
    let disposed = false;
    setError(false);
    setLoaded(undefined);
    void Promise.all(currentItems.current.map(item => item.processRef ? read(context.load, item.processRef) : [item]))
      .then(groups => { if (!disposed) setLoaded(groups.flat()); })
      .catch(() => { if (!disposed) setError(true); });
    return () => { disposed = true; };
    // Payload identity is the stable reference; history refreshes may recreate summary objects.
  }, [context.load, context.active, active, key, attempt]);
  if (error) return <p role="status"><button type="button" onClick={() => retry(value => value + 1)}>
    {uiText('client.chat.couldNotLoadSelectToRetry')}</button></p>;
  return loaded ? children(loaded) : <p role="status">{uiText('client.mobile.loading')}</p>;
}

/** Only mount inside an explicitly opened process; collapsing releases all loaded rows. */
export function DeferredProcessDetails({ items, active = true, children }: {
  items: Item[]; active?: boolean; children: (items: Item[]) => ReactNode;
}) {
  return items.some(item => item.processRef)
    ? <LoadedProcess items={items} active={active}>{children}</LoadedProcess> : children(items);
}
