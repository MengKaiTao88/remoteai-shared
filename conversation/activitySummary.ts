import type { Item } from './types';
import { uiText } from '../localization/uiText';
import { commandPreview } from '../chat/commandPreview';

export function commandActivityLabel(item: Item, translate = uiText): string {
  const action = item.commandActions?.find(entry => entry.type !== 'unknown');
  const actions = { read: 'client.chat.readFile', listFiles: 'client.chat.browseFiles',
    search: 'client.chat.searchCode' } as const;
  if (action) return translate('client.interface.message.7c639b', {
    value1: translate(actions[action.type as keyof typeof actions] ?? 'client.chat.runCommand'),
    value2: action.name || action.query || action.path || '',
  });
  const states = { inProgress: 'client.mobile.running', completed: 'client.mobile.ran',
    failed: 'client.mobile.runFailed', declined: 'client.chat.declined', interrupted: 'client.chat.stopped' } as const;
  const label = translate(states[item.status as keyof typeof states] ?? 'client.chat.runCommand');
  return `${label} ${commandPreview(item.commandPreview ?? item.command ?? '')}`;
}

/** Summarize the complete group, rather than disguising earlier operations as the last command. */
export function activityGroupLabel(items: readonly Item[], translate = uiText): string {
  const commands = items.filter(item => item.type === 'commandExecution').length;
  const edits = items.filter(item => item.type === 'fileChange');
  const paths = new Set(edits.flatMap(item => item.changes?.map(change => change.path) ?? []));
  const other = items.length - commands - edits.length;
  return [
    edits.length ? translate('client.chat.activityGroupFiles', { value1: paths.size || edits.length }) : '',
    commands ? translate('client.chat.activityGroupCommands', { value1: commands }) : '',
    other ? translate('client.chat.activityGroupOperations', { value1: other }) : '',
  ].filter(Boolean).join(' · ');
}

/** Keep a failed or rejected operation visible even if the last operation succeeded. */
export function activityGroupStatus(items: readonly Item[]): string | undefined {
  return ['inProgress', 'failed', 'declined', 'interrupted']
    .find(status => items.some(item => item.status === status)) ?? items.at(-1)?.status;
}

export function activityFileNames(item: Item): string {
  return item.changes?.map(change => change.path.split(/[\\/]/).at(-1)).join(', ') ?? '';
}
