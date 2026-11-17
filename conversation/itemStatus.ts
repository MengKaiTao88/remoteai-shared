import type { Item } from './types';

const FINISHED = new Set(['completed', 'failed', 'declined', 'interrupted', 'cancelled']);

/** Hosts can report a completed process with a non-zero exit code or structured failure. */
export function activityStatus(item: Item): string | undefined {
  if (item.failure || item.exitCode != null && item.exitCode !== 0 || item.status === 'failed') return 'failed';
  return item.status === 'cancelled' ? 'interrupted' : item.status;
}

export function isItemFinished(status: Item['status']): boolean {
  return FINISHED.has(status ?? '');
}

/** A cached start or delayed notification cannot restart the same completed execution. */
export function mergeItemLifecycle(previous: Item, incoming: Item): Item {
  if (previous.id === incoming.id && isItemFinished(previous.status) && incoming.status === 'inProgress') {
    return previous;
  }
  return { ...previous, ...incoming };
}
