import { useEffect, useState, type SetStateAction } from 'react';
import type { LoungeController } from './controller';
import type { LoungeDraft, LoungeSnapshot } from './types';

const EMPTY_DRAFT: LoungeDraft = { text: '', images: [] };
interface DraftEntry { value: LoungeDraft; deletedAt: number }

/** Keep drafts within the signed-in account and invalidate them when a conversation is deleted. */
export function useLoungeDrafts(controller: LoungeController, state: LoungeSnapshot) {
  const userId = state.user?.id;
  const conversation = state.conversation;
  const deletedAt = state.deletedConversations?.[conversation] ?? 0;
  const [stored, setStored] = useState(() => ({ controller, userId, drafts: {} as Record<string, DraftEntry> }));
  const owned = stored.controller === controller && stored.userId === userId;
  const entry = owned ? stored.drafts[conversation] : undefined;
  const draft = entry?.deletedAt === deletedAt ? entry.value : EMPTY_DRAFT;

  useEffect(() => {
    setStored(current => {
      if (current.controller !== controller || current.userId !== userId) {
        return { controller, userId, drafts: {} };
      }
      const entries = Object.entries(current.drafts).filter(([peer, value]) =>
        value.deletedAt === (state.deletedConversations?.[peer] ?? 0));
      return entries.length === Object.keys(current.drafts).length ? current
        : { ...current, drafts: Object.fromEntries(entries) };
    });
  }, [controller, userId, state.deletedConversations]);

  const change = (update: SetStateAction<LoungeDraft>) => setStored(current => {
    const latest = controller.snapshot();
    if (current.controller !== controller || current.userId !== userId || latest.user?.id !== userId
      || (latest.deletedConversations?.[conversation] ?? 0) !== deletedAt) return current;
    const previous = current.drafts[conversation];
    const value = previous?.deletedAt === deletedAt ? previous.value : EMPTY_DRAFT;
    return { ...current, drafts: { ...current.drafts, [conversation]: {
      value: typeof update === 'function' ? update(value) : update, deletedAt,
    } } };
  });
  return { draft, change };
}
