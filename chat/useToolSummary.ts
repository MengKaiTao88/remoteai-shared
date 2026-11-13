import { useCallback, useContext, useState } from 'react';
import type { Item } from '../conversation/types';
import { isItemFinished } from '../conversation/itemStatus';
import { uiText } from '../localization/uiText';
import { ToolDetailsContext } from './DeferredToolDetails';

type Completion = Pick<Item, 'status' | 'exitCode' | 'durationMs'>;

/** Retain only completion metadata when the expanded payload has caught up before its summary. */
export function useToolSummary(item: Item) {
  const { load } = useContext(ToolDetailsContext);
  const key = JSON.stringify([item.id, item.detailsRef]);
  const [completion, setCompletion] = useState<{ key: string; load: typeof load; value: Completion }>();
  const onLoad = useCallback((loaded: Item) => {
    if (loaded.id !== item.id || !isItemFinished(loaded.status)) return;
    const { status, exitCode, durationMs } = loaded;
    setCompletion({ key, load, value: { status, exitCode, durationMs } });
  }, [item.id, key, load]);
  const recovered = completion?.key === key && completion.load === load && !isItemFinished(item.status);
  return { item: recovered ? { ...item, ...completion.value } : item, onLoad };
}

export function commandStatusLabel(status: Item['status']) {
  if (status === 'inProgress') return uiText('client.mobile.running');
  if (status === 'completed') return uiText('client.mobile.ran');
  if (status === 'failed') return uiText('client.mobile.runFailed');
  if (status === 'declined') return uiText('client.chat.declined');
  if (status === 'interrupted') return uiText('client.chat.stopped');
  return uiText('client.chat.runCommand');
}
