import { downloadManager } from '../../downloads/manager';
import { managedDownloadsChanged, registerManagedDownloads } from '../../downloads/managedTasks';
import { storeDownload } from '../../downloads/storage';
import type { DownloadTask } from '../../downloads/types';
import { closePreparedSync, closeTransfer, uploadPreparedSync, type PreparedSync } from './transfer';
import type { SyncBundle, SyncHost, SyncProvider, SyncResult } from './types';
import { uiText } from '../../localization/uiText';
import { syncAwait } from './abort';

const directories = new Map<string, Map<string, SyncHost>>();
const cleanupFlights = new Set<string>();

/** Connections outlive the sync dialog, and are recreated from the signed-in directory after restart. */
export function syncHosts(owner: string, entries: { id: string; create: () => SyncHost }[]) {
  let directory = directories.get(owner);
  if (!directory) { directory = new Map(); directories.set(owner, directory); }
  return entries.map(entry => {
    let host = directory!.get(entry.id);
    if (!host) { host = { ...entry.create(), owner }; directory!.set(entry.id, host); }
    return host;
  });
}

export function notifySyncHosts() {
  managedDownloadsChanged();
  void downloadManager.initialize().then(() => {
    for (const task of downloadManager.snapshot()) {
      if (task.sync?.cleanupPending && task.status === 'completed' && !cleanupFlights.has(task.id)) {
        cleanupFlights.add(task.id);
        void cleanupSyncDownload(task).then(cleaned => downloadManager.updateManaged(cleaned))
          .catch(() => { /* A later directory refresh retries cleanup with the saved capabilities. */ })
          .finally(() => cleanupFlights.delete(task.id));
      }
    }
  });
}

export function releaseSyncHosts(owner: string) {
  directories.get(owner)?.forEach(host => host.close?.());
  directories.delete(owner); managedDownloadsChanged();
}

function hosts(task: DownloadTask) {
  const directory = directories.get(task.source.owner);
  return { source: directory?.get(task.sync?.sourceHost ?? ''),
    destination: directory?.get(task.sync?.destinationHost ?? '') };
}

async function reclaim(host: SyncHost, bundle: SyncBundle) {
  if (!bundle.resumeToken) return bundle;
  const resumed = await host.request<SyncBundle>({ action: 'resume', id: bundle.id, resumeToken: bundle.resumeToken });
  if (resumed.size !== bundle.size || resumed.sha256 !== bundle.sha256
    || !Number.isSafeInteger(resumed.written) || resumed.written! < 0 || resumed.written! > bundle.size) {
    throw new Error('CONVERSATION_SYNC_INVALID');
  }
  return resumed;
}

async function cleanupSyncDownload(task: DownloadTask) {
  const { source, destination } = hosts(task);
  if (!source || !destination) return task;
  const sync = task.sync!;
  const close = async (host: SyncHost, bundle: SyncBundle) => {
    if (!bundle.resumeToken) return true;
    try { await reclaim(host, bundle); }
    catch (error) {
      // An expired/already closed handle has no resumable temporary payload left.
      if (error instanceof Error && error.message === 'CONVERSATION_SYNC_INVALID') return true;
      return false;
    }
    return closeTransfer(host, bundle.id);
  };
  const destinationClosed = await close(destination, sync.destinationBundle);
  const sourceClosed = !sync.sourceBundle || await close(source, sync.sourceBundle);
  if (!destinationClosed || !sourceClosed) return task;
  return { ...task, sync: { ...sync, cleanupPending: false,
    destinationBundle: { ...sync.destinationBundle, resumeToken: undefined },
    sourceBundle: sync.sourceBundle && { ...sync.sourceBundle, resumeToken: undefined } } };
}

async function runSyncDownload(options: {
  task: DownloadTask; signal: AbortSignal; update: (task: DownloadTask) => void;
}): Promise<DownloadTask> {
  let task = options.task;
  const { signal, update } = options;
  const sync = task.sync!;
  const { source, destination } = hosts(task);
  if (!source || !destination) throw new Error('CONVERSATION_SYNC_CLOSED');
  signal.throwIfAborted();
  const received = await syncAwait(reclaim(destination, sync.destinationBundle), signal);
  signal.throwIfAborted();
  const needsTransfer = sync.sourceBundle && (sync.overwriteIds.length || sync.plan.count > sync.plan.duplicateIds.length);
  const prepared: PreparedSync = { id: received.id, bundle: received, plan: sync.plan };
  if (needsTransfer && received.written !== received.size) {
    const bundle = await syncAwait(reclaim(source, sync.sourceBundle!), signal);
    prepared.remote = { host: source, bundle };
    task = { ...task, received: received.written ?? 0, status: 'downloading' };
    update(task);
    await uploadPreparedSync({ prepared, destination, signal, offset: task.received,
      progress: async (fraction) => {
        task = { ...task, received: Math.round(fraction * task.size),
          sync: { ...sync, mode: syncTransferMode(source, destination) } };
        await storeDownload(task); update(task);
      } });
  }
  signal.throwIfAborted();
  task = { ...task, received: task.size, status: 'verifying' }; update(task);
  const result = await destination.request<SyncResult>({ action: 'commit', id: received.id,
    overwriteIds: sync.overwriteIds, modelProvider: sync.provider });
  task = { ...task, status: 'completed', completedAt: Date.now(), bytesPerSecond: undefined,
    verified: true, sync: { ...task.sync!, result, cleanupPending: true }, message: '' };
  // Save the import result before removing either resume capability.
  await storeDownload(task); update(task);
  return cleanupSyncDownload(task);
}

export function syncTransferMode(source: SyncHost, destination: SyncHost) {
  const modes = [source.mode?.(), destination.mode?.()].filter(Boolean);
  if (modes.includes('relay')) return 'relay';
  return modes.length && modes.every(mode => mode === 'direct') ? 'direct' : 'connecting';
}

export async function enqueueSyncDownload(options: {
  prepared: PreparedSync; source: SyncHost; destination: SyncHost;
  overwriteIds: string[]; provider: SyncProvider;
}) {
  const { prepared, source, destination, overwriteIds, provider } = options;
  if (!prepared.bundle.resumeToken || (prepared.remote && !prepared.remote.bundle.resumeToken)) {
    throw new Error('CONVERSATION_SYNC_FAILED');
  }
  const owner = source.id === 'local' && destination.id === 'local'
    ? 'desktop-local' : destination.owner ?? source.owner ?? 'desktop-local';
  const directory = directories.get(owner) ?? new Map<string, SyncHost>();
  directory.set(source.id, source); directory.set(destination.id, destination); directories.set(owner, directory);
  const task: DownloadTask = { id: crypto.randomUUID(),
    name: `${uiText('client.workspaceSettings.conversationSync')} · ${prepared.plan.count}.zip`,
    source: { owner, deviceId: source.id, deviceName: source.name || uiText('client.git.local'),
      scope: 'computer', path: source.name || uiText('client.workspaceSettings.conversationSync') },
    status: 'queued', received: 0, size: prepared.bundle.size, createdAt: Date.now(), message: '',
    sync: { sourceHost: source.id, destinationHost: destination.id, destinationBundle: prepared.bundle,
      sourceBundle: prepared.remote?.bundle, plan: prepared.plan, overwriteIds, provider } };
  return downloadManager.enqueueManaged(task);
}

registerManagedDownloads({ matches: task => !!task.sync,
  retryable: error => !(error instanceof Error
    && ['CONVERSATION_SYNC_CHANGED', 'CONVERSATION_SYNC_INVALID'].includes(error.message)),
  connected: task => { const pair = hosts(task); return !!pair.source && !!pair.destination; },
  run: runSyncDownload,
  remove: async task => {
    const { source, destination } = hosts(task);
    if (destination) await closePreparedSync(destination, { id: task.sync!.destinationBundle.id,
      bundle: task.sync!.destinationBundle, plan: task.sync!.plan,
      ...(source && task.sync!.sourceBundle ? { remote: { host: source, bundle: task.sync!.sourceBundle } } : {}) });
  },
});
