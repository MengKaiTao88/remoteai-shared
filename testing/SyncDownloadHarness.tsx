import { useState } from 'react';
import { Button } from 'antd';
import { ConversationSyncPanel } from '../conversation/sync/ConversationSyncPanel';
import { DownloadWorkspace } from '../downloads/desktop/DownloadWorkspace';
import { useDownloadTasks } from '../downloads/useDownloadTasks';
import { uiText } from '../localization/uiText';
import type { SyncHost } from '../conversation/sync/types';

export function SyncDownloadHarness(props: { hosts: SyncHost[]; destination: SyncHost }) {
  const [downloads, showDownloads] = useState(false);
  const { tasks, busy, error, run, removeTasks } = useDownloadTasks('desktop-local', {
    confirmRemove: async () => true,
  });
  return <>
    <Button onClick={() => showDownloads(value => !value)}>
      {uiText(downloads ? 'client.workspaceSettings.conversationSync' : 'client.downloads.downloads')}</Button>
    {downloads ? <DownloadWorkspace tasks={tasks} owner="desktop-local" busy={!!busy} error={error}
      run={run} removeTasks={removeTasks} /> : <ConversationSyncPanel {...props} onSynced={() => {}} />}
  </>;
}
