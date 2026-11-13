import { useState } from 'react';
import { DeferredProcessDetails } from '../../chat/DeferredProcessDetails';
import { groupConsecutiveActivities, latestActivity } from '../../conversation/activityGroups';
import type { Item, Turn } from './types';
import { ChatMessage } from './ChatMessage';
import { ChatActivity } from './ChatActivity';
import { ChatToolDetails } from './ChatToolDetails';

/** Loaded process rows belong to this disclosure, never to the history pagination window. */
export function ChatProcessItems({ items, turn }: { items: Item[]; turn: Turn }) {
  return <DeferredProcessDetails items={items}>
    {loaded => <LoadedItems items={loaded} turn={turn} />}
  </DeferredProcessDetails>;
}

function LoadedItems({ items, turn }: { items: Item[]; turn: Turn }) {
  const [selected, setSelected] = useState<string>();
  const selectedItem = items.find(item => item.id === selected);
  const message = (item: Item) => <ChatMessage key={item.id} item={item} process desktop
    running={turn.status === 'inProgress' && item.status !== 'completed'} onOpen={setSelected} />;
  return <>
    {groupConsecutiveActivities(items).map(group => {
      const latest = latestActivity(group.items);
      if (!group.activity || group.items.length === 1 || !latest) return message(group.items[0]);
      return <ChatActivity key={group.key} item={latest} items={group.items} inline
        running={false} onOpen={() => setSelected(latest.id)} content={() => group.items.map(message)} />;
    })}
    {selectedItem && <ChatToolDetails item={selectedItem} onClose={() => setSelected(undefined)} />}
  </>;
}
