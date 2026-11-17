import { groupTurnItems } from '../chat/turnGroups';
import { hasVisibleProcessContent } from '../chat/processContent';
import { requestErrorPosition, turnRequestErrors } from './turnRequestErrors';
import type { Item, Thread, Turn } from './types';
import { summarizeCommands } from '../remote-chat/commandMetrics';
import { activityStatus } from './itemStatus';

export const processActivityCount = (items: Item[]) =>
  items.reduce((count, item) => count + (item.activityCount ?? 1), 0);

export const processOutputs = (items: Item[]): Item[] => items.flatMap(item => item.processOutputs ?? [item]);

function summarizeGroup(items: Item[], threadId: string, turnId: string): Item[] {
  if (items.some(item => item.processRef)) return items;
  const visible = items.filter(hasVisibleProcessContent);
  if (!visible.length) return [];
  return [{ id: items[0].id, type: 'processSummary', activityCount: visible.length,
    processRef: { threadId, turnId, itemId: items[0].id, endItemId: items.at(-1)!.id },
    processCommandMetrics: summarizeCommands([{ id: turnId, items }]),
    processActivityMetrics: visible.reduce((counts, item) => {
      if (item.type === 'commandExecution') counts.commands++;
      else if (!['reasoning', 'agentMessage'].includes(item.type)) counts.tools++;
      if (activityStatus(item) === 'failed') counts.failed++;
      if (activityStatus(item) === 'interrupted') counts.stopped++;
      return counts;
    }, { commands: 0, tools: 0, failed: 0, stopped: 0 }),
    processOutputs: items.filter(item => ['fileChange', 'imageGeneration'].includes(item.type)) }];
}

function summarizeTurn(turn: Turn, threadId: string): Turn {
  // Live and stopped turns retain their automatic, visible activity stream.
  if (turn.status !== 'completed') return turn;
  const boundaries = new Set(turnRequestErrors(turn).map(error => requestErrorPosition(turn, error)));
  let offset = 0;
  const items = groupTurnItems(turn.items).flatMap(group => {
    const start = offset;
    offset += group.items.length;
    if (group.type === 'message') return group.items;
    const result: Item[] = [];
    let from = 0;
    for (let index = 1; index <= group.items.length; index++) {
      if (index !== group.items.length && !boundaries.has(start + index)) continue;
      result.push(...summarizeGroup(group.items.slice(from, index), threadId, turn.id));
      from = index;
    }
    return result;
  });
  const requestErrors = turn.requestErrors?.map(error => {
    const summary = items.find(item => item.processRef?.endItemId === error.afterItemId);
    return summary ? { ...error, afterItemId: summary.id } : error;
  });
  return { ...turn, items, ...(requestErrors ? { requestErrors } : {}) };
}

/** History contains one lightweight item per folded process, regardless of its execution count. */
export function summarizeProcesses(thread: Thread): Thread {
  return { ...thread, turns: thread.turns?.map(turn => summarizeTurn(turn, thread.id)) };
}
