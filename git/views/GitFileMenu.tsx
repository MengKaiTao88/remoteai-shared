import { displayText } from '../../localization/browserClient';
import { GitContextMenu } from './GitContextMenu';
import { GitCommitHorizontal, Trash2, Undo2 } from 'lucide-react';
import type { ReactElement } from 'react';
import type { GitFileRow } from '../../remote-chat/useGitFileList';
import type { RemoteGit } from '../../remote-chat/useRemoteGit';

import { deletableGitFiles, gitFileMenuLabels } from '../../remote-chat/gitMenu';
import { t } from '../../localization/browserClient';

export function GitFileMenu({ row, panel, connected, children }: {
  row: GitFileRow; panel: RemoteGit; connected: boolean; children: ReactElement;
}) {
  if (row.kind === 'area') return children;
  if (row.file?.conflict) return <GitContextMenu disabled={panel.busy || !connected}
    menu={{ items: [{ key: 'resolve', label: t('client.gitConflict.resolve') }],
      onClick: () => { void panel.openConflict(row.path); } }}>{children}</GitContextMenu>;
  const labels = gitFileMenuLabels(row.kind === 'folder');
  const deletable = deletableGitFiles(row.files);
  const disabled = !row.files.length || panel.busy || !connected || panel.changes?.files.some(item => item.conflict);
  return <GitContextMenu disabled={disabled} overlayClassName="git-file-context-menu"
    menu={{ items: [
      { key: 'commit', label: displayText(labels.commit),
        icon: <GitCommitHorizontal size={16} /> },
      { key: 'rollback', label: displayText(labels.rollback), icon: <Undo2 size={16} />,
        disabled: row.files.some(file => file.submodule) },
      { type: 'divider' },
      { key: 'delete', label: displayText(labels.delete), icon: <Trash2 size={16} />,
        danger: true, disabled: !deletable.length },
    ], onClick: ({ key }) => {
      if (key === 'commit' || key === 'rollback') panel.requestFileAction(key, row.files);
      if (key === 'delete') panel.requestFileAction(key, deletable);
    } }}>{children}</GitContextMenu>;
}
