import { useMemo, useState } from 'react';
import { Alert, Button, Descriptions, Input, Modal, Progress, Radio, Select, Space } from 'antd';
import { RefreshCw, Search, FolderSync } from 'lucide-react';
import { uiText } from '../../localization/uiText';
import { useGuiLanguage } from '../../localization/useGuiLanguage';
import { useConversationSync, useSyncSources, useSyncThreads } from './useConversationSync';
import type { SyncHost } from './types';
import { SyncThreadTable } from './SyncThreadTable';
import { SyncSourceLabel } from './SyncSourceLabel';
import { formatBytes } from '../../downloads/DownloadCard';
import styles from './sync.module.less';

export function syncError(error: unknown) {
  const code = error instanceof Error ? error.message : String(error);
  return uiText(code === 'CONVERSATION_SYNC_CHANGED' || code === 'client.conversationSync.changed'
    ? 'client.conversationSync.changed'
    : 'client.conversationSync.failed');
}

export function ConversationSyncPanel({ hosts, destination, onSynced }: {
  hosts: SyncHost[]; destination: SyncHost; onSynced: () => void;
}) {
  useGuiLanguage();
  const directory = useSyncSources(hosts, destination);
  const [sourceKey, setSource] = useState('');
  const [notice, setNotice] = useState('');
  const source = directory.sources.find(source => source.key === sourceKey) ?? directory.sources[0];
  const list = useSyncThreads(source);
  const moving = source?.host.id === destination.id;
  const sync = useConversationSync({ destination, source, selected: list.selected, complete: result => {
    setNotice(uiText('client.conversationSync.completed', { count: result.completedCount, skipped: result.skippedCount }));
    list.setSelected([]); list.refresh(); onSynced();
  } });
  const [kind, setKind] = useState('all');
  const threads = useMemo(() => kind === 'all' ? list.threads
    : list.threads.filter(thread => thread.sessionKind === kind), [kind, list.threads]);
  const locked = sync.open || sync.busy;
  return <section className={styles.panel} aria-label={uiText('client.workspaceSettings.conversationSync')}>
    <div className={styles.toolbar}>
      <Select className={styles.source} value={source?.key} onChange={setSource} loading={directory.loading}
        aria-label={uiText('client.conversationSync.source')} placeholder={uiText('client.conversationSync.source')}
        disabled={locked} showSearch optionFilterProp="searchLabel"
        popupMatchSelectWidth options={directory.sources.map(source => ({ value: source.key,
          label: <SyncSourceLabel source={source} />, searchLabel: source.label, title: source.label }))} />
      <Input value={list.query} disabled={locked} allowClear prefix={<Search size={16} />}
        onChange={event => list.setQuery(event.target.value)} placeholder={uiText('client.conversationSync.search')} />
      <Select value={kind} onChange={setKind} disabled={locked} aria-label={uiText('client.conversationSync.kind')}
        options={['all', 'conversation', 'external', 'subagent'].map(value => ({ value,
          label: uiText(({ all: 'client.conversationSync.kind.all', conversation: 'client.conversationSync.kind.conversation',
            external: 'client.conversationSync.kind.external', subagent: 'client.conversationSync.kind.subagent' } as const)
            [value as 'all' | 'conversation' | 'external' | 'subagent']) }))} />
      <Button icon={<RefreshCw size={16} />} aria-label={uiText('client.conversationSync.refresh')}
        disabled={locked} loading={list.loading || directory.loading}
        onClick={() => { directory.retry(); list.refresh(); }} />
      <Button type="primary" icon={<FolderSync size={16} />} disabled={locked || !list.selected.length}
        onClick={() => void sync.show()}>{uiText('client.workspaceSettings.conversationSync')}</Button>
    </div>
    {directory.failures.length > 0 && <Alert type="warning" showIcon message={
      uiText('client.conversationSync.unavailable', { names: directory.failures.join('、') })} />}
    {list.error !== undefined && <Alert type="error" showIcon message={syncError(list.error)} />}
    {notice && <Alert type="success" showIcon message={notice} closable onClose={() => setNotice('')} />}
    <SyncThreadTable key={source?.key} threads={threads} selected={list.selected} onSelect={list.setSelected}
      loading={list.loading || directory.loading} locked={locked} query={list.query} />
    <Modal open={sync.open} title={uiText('client.conversationSync.confirm')} width={480}
      onCancel={sync.cancel} onOk={() => void sync.commit()} confirmLoading={sync.committing}
      okText={uiText(sync.task && !sync.busy ? 'client.downloads.resumeDownload' : 'client.conversationSync.start')}
      cancelText={uiText(sync.task ? 'client.conversationSync.background' : 'client.conversationSync.cancel')}
      okButtonProps={{ disabled: sync.busy || !sync.prepared, loading: sync.busy }}
      cancelButtonProps={{ disabled: sync.committing }}
      closable={!sync.committing} maskClosable={false} keyboard={!sync.committing}>
      <div className={styles.confirm}>
        <Descriptions size="small" column={1} items={[
          { key: 'source', label: uiText('client.conversationSync.source'),
            children: source && <SyncSourceLabel source={source} /> },
          { key: 'destination', label: uiText('client.conversationSync.destination'), children: destination.name || 'Codex GUI' },
          { key: 'count', label: uiText('client.conversationSync.selection'),
            children: sync.prepared?.plan.count ?? list.selected.length },
          { key: 'total', label: uiText('client.conversationSync.totalSize'),
            children: sync.prepared ? formatBytes(sync.prepared.bundle.originalSize ?? sync.prepared.bundle.size) : '…' },
          ...(!moving ? [{ key: 'archive', label: uiText('client.conversationSync.archiveSize'),
            children: sync.prepared ? formatBytes(sync.prepared.bundle.size) : '…' }] : []),
        ]} />
        <p>{uiText(moving ? 'client.conversationSync.moveHint' : 'client.conversationSync.copyHint')}</p>
        {sync.task && <div aria-live="polite">
          <Progress percent={Math.round(sync.progress * 100)}
            status={sync.task.status === 'failed' ? 'exception' : sync.busy ? 'active' : 'normal'} />
          <p>{formatBytes(sync.task.received)} / {formatBytes(sync.task.size)}</p>
          <p>{uiText(sync.committing ? 'client.conversationSync.importing' : 'client.conversationSync.inDownloads')}</p>
          {sync.transferring && <Button size="small" onClick={() => void sync.pause()}>
            {uiText('client.downloads.pause')}</Button>}
        </div>}
        {!moving && <Descriptions size="small" column={1} items={[
          { key: 'mode', label: uiText('client.conversationSync.connection'),
            children: sync.transfer.mode === 'direct' ? 'P2P' : sync.transfer.mode === 'relay' ? 'Relay'
              : uiText('client.conversationSync.connecting') },
          { key: 'speed', label: uiText('client.conversationSync.speed'),
            children: `${(sync.transfer.bytesPerSecond / 1024).toFixed(1)} KB/s` },
        ]} />}
        {Boolean(sync.prepared?.plan.duplicateIds.length) && <div className={styles.duplicates}>
          <p>{uiText('client.conversationSync.duplicates', { count: sync.prepared!.plan.duplicateIds.length })}</p>
          <Radio.Group value={sync.overwrite} onChange={event => sync.setOverwrite(event.target.value as boolean)}
            disabled={sync.busy || !!sync.task}><Space direction="vertical">
            <Radio value={false}>{uiText('client.conversationSync.skip')}</Radio>
            <Radio value={true}>{uiText('client.conversationSync.overwrite')}</Radio>
          </Space></Radio.Group>
        </div>}
        <label className={styles.provider}>{uiText('client.conversationSync.provider')}
          <Select value={sync.provider} onChange={sync.setProvider} disabled={sync.busy || !!sync.task}
            aria-label={uiText('client.conversationSync.provider')}
            options={['openai', 'codex-switch-local', 'codex-switch-gui'].map(value => ({ value, label: value }))} />
        </label>
        {sync.error !== undefined && <Alert type="error" showIcon message={syncError(sync.error)} />}
      </div>
    </Modal>
  </section>;
}
