import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Item } from '../conversation/types';
import { guiApi } from '../conversation/api';
import { uiText } from '../localization/uiText';
import { isItemFinished } from '../conversation/itemStatus';

type Target = NonNullable<Item['detailsRef']>;
export type ToolDetailsLoader = (target: Target) => Promise<{ item: Item }>;
export const localToolDetails: ToolDetailsLoader = target => guiApi.request({ operation: 'toolDetails', ...target });
export const ToolDetailsContext = createContext<{ load: ToolDetailsLoader; active: boolean }>({
  load: localToolDetails, active: true,
});
const REFRESH_MS = 1000;

function LoadedDetails({ item, children, onLoad }: {
  item: Item; children: (item: Item) => ReactNode; onLoad?: (item: Item) => void;
}) {
  const { load, active } = useContext(ToolDetailsContext);
  const target = item.detailsRef!;
  const [loaded, setLoaded] = useState<Item>();
  const [error, setError] = useState(false);
  const [attempt, retry] = useState(0);
  const pending = useRef<Promise<unknown>>();
  const report = useRef(onLoad);
  report.current = onLoad;
  useEffect(() => { setLoaded(undefined); }, [load]);
  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = async () => {
      // A completion or retry waits for the previous refresh, then reads the authoritative final result.
      await pending.current;
      if (disposed) return;
      const request = load({ threadId: target.threadId, turnId: target.turnId, itemId: target.itemId });
      pending.current = request.catch(() => undefined);
      try {
        const result = await request;
        if (disposed) return;
        setLoaded(result.item); setError(false);
        report.current?.(result.item);
        if (item.status === 'inProgress' && !isItemFinished(result.item.status)) {
          timer = setTimeout(() => void refresh(), REFRESH_MS);
        }
      } catch {
        if (!disposed) setError(true);
      }
    };
    setError(false);
    void refresh();
    return () => { disposed = true; clearTimeout(timer); };
  }, [load, active, target.threadId, target.turnId, target.itemId, item.status, attempt]);
  return <>
    {error ? <p role="status"><button type="button" onClick={() => retry(value => value + 1)}>
      {uiText('client.chat.couldNotLoadSelectToRetry')}</button></p>
      : !loaded && <p role="status">{uiText('client.mobile.loading')}</p>}
    {loaded && children(loaded)}
  </>;
}

/** Mount only inside an opened detail view. Unmounting releases its payload and stops refreshes. */
export function DeferredToolDetails({ item, children, onLoad }: {
  item: Item; children: (item: Item) => ReactNode; onLoad?: (item: Item) => void;
}) {
  if (!item.detailsRef) return children(item);
  const key = JSON.stringify(item.detailsRef);
  return <LoadedDetails key={key} item={item} onLoad={onLoad}>{children}</LoadedDetails>;
}
