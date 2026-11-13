import { ChatComposer } from '../remote-chat/views/ChatComposer';
import type { ComposerProps } from '../remote-chat/views/composerProps';
import { testModels } from '../conversation/testing/models';
import { composerSshProfiles } from './sshProfiles';

export const sshComposerStore = { async list() {
  const params = new URLSearchParams(location.search);
  const delay = Number(params.get('delay') ?? 0);
  if (delay) await new Promise(resolve => setTimeout(resolve, delay));
  if (params.has('fail')) throw new Error('Fixture unavailable');
  return params.has('empty') ? [] : composerSshProfiles;
} };

const noop = () => {};
export const sshComposerProps: Omit<ComposerProps, 'send'> = {
  sshProfiles: sshComposerStore, models: testModels,
  selection: { model: 'gpt-test', effort: 'high', access: 'workspace-write' },
  threadId: 'ssh-fixture', active: true, ready: true, sending: false, running: false,
  settingsBusy: false, settingsError: '', compacting: false, compactReason: null, goalBusy: false, cwd: '/project',
  updateSettings: async () => {}, refreshModels: async () => {}, interrupt: async () => {}, compact: async () => true,
  goals: { load: async () => {}, clear: async () => true },
  contextSettings: { read: async () => ({ capacity: null }), write: async (_id, value) => value },
  catalog: { skills: [], loaded: true, loading: false, error: '', refresh: noop },
  loadFiles: async () => ({ directory: '/project', parent: null, entries: [], truncated: false }),
  loadCatalog: async () => ({ data: [], plugins: [] }),
  loadConversations: async () => ({ data: [], nextCursor: null }),
  readUsage: async () => ({ totalTokens: 0, estimatedCostUsd: 0, primaryRemainingPercent: null,
    primaryRemainingAggregated: false, providerEstimatedCost: null }),
  readConversationMetrics: async () => ({ totalOutputTokens: 0, totalOutputTimeMs: 0, outputRequestCount: 0 }),
  connection: { deviceName: 'Office PC', chooseDevice: noop, client: {
    read: async () => ({ running: true, choices: [], selection: { kind: 'none' } }),
    select: async selection => selection, subscribe: () => noop,
  } },
};

export function RemoteSshComposerFixture() {
  return <ChatComposer {...sshComposerProps} send={async input => {
    document.body.dataset.sent = JSON.stringify(input); return true;
  }} />;
}
