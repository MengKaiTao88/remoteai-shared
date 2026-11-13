import { FolderSearch, GitBranch, Globe } from 'lucide-react';
import { useDiffText } from '../chat/diffText';
import type { WorkspaceLauncher, WorkspaceLauncherId } from '../chat/workspaceLaunchers';
import styles from './WorkspaceStartPage.module.less';

export function WorkspaceStartPage({ launchers, openBrowser }: {
  launchers: ReadonlyMap<WorkspaceLauncherId, WorkspaceLauncher>;
  openBrowser: () => void;
}) {
  const t = useDiffText();
  const git = launchers.get('git');
  const files = launchers.get('files');
  return <div className={styles.start}>
    <nav aria-label={t('client.desktopGuiExtras.sidebarContent')} className={styles.actions}>
      <button type="button" onClick={openBrowser}>
        <Globe size={18} /><span>{t('client.configLabels.browser')}</span>
      </button>
      <button type="button" disabled={!git?.enabled} onClick={git?.open}>
        <GitBranch size={18} /><span>Git</span>
      </button>
      <button type="button" disabled={!files?.enabled} onClick={files?.open}>
        <FolderSearch size={18} /><span>{t('client.projectBrowser.browseFiles')}</span>
      </button>
    </nav>
  </div>;
}
