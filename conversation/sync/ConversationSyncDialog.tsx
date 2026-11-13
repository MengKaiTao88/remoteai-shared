import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Button, Modal, Spin } from 'antd';
import { FolderSync } from 'lucide-react';
import { uiText } from '../../localization/uiText';
import { useGuiLanguage } from '../../localization/useGuiLanguage';
import styles from './sync.module.less';

export const SyncDialogPanel = lazy(() => import('./ConversationSyncPanel')
  .then(module => ({ default: module.ConversationSyncPanel })));

export function ConversationSyncDialog({ children, active = true }: {
  children: ReactNode; active?: boolean;
}) {
  useGuiLanguage();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!active) setOpen(false); }, [active]);
  return <>
    <Button type="text" icon={<FolderSync size={17} />} disabled={!active} onClick={() => setOpen(true)}
      aria-label={uiText('client.workspaceSettings.conversationSync')} />
    <Modal className={styles.dialog} open={open} onCancel={() => setOpen(false)} width={1000}
      footer={null} destroyOnHidden
      title={uiText('client.workspaceSettings.conversationSync')} maskClosable={false}>
      {open && <Suspense fallback={<Spin />}>{children}</Suspense>}
    </Modal>
  </>;
}
