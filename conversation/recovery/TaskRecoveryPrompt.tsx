import { useEffect } from 'react';
import { Button, Modal, notification, Space } from 'antd';
import { uiText } from '../../localization/uiText';
import { useGuiLanguage } from '../../localization/useGuiLanguage';
import { useTaskRecovery } from './useTaskRecovery';
import type { RecoveryClient } from './types';

export function TaskRecoveryPrompt({ client, enabled, openThread }: {
  client: RecoveryClient; enabled: boolean; openThread: (threadId: string) => void;
}) {
  useGuiLanguage();
  const recovery = useTaskRecovery(client, enabled);
  const [notice, holder] = notification.useNotification();
  useEffect(() => () => notice.destroy('task-recovery'), [client, enabled, notice]);
  const { failure, readFailed, clearFailure, clearReadFailure } = recovery;
  useEffect(() => {
    if (!failure && !readFailed) return;
    notice.warning({ key: 'task-recovery', message: uiText(failure
      ? 'client.taskRecovery.failed' : 'client.taskRecovery.unavailable'), duration: 0,
      style: { width: 400, maxWidth: 'calc(100vw - 32px)' },
      description: failure && <Space direction="vertical" size={0}>
        {failure.failed.map(item => <Button key={item.threadId} type="link"
          style={{ paddingInline: 0, whiteSpace: 'normal', height: 'auto', textAlign: 'start' }}
          onClick={() => { notice.destroy('task-recovery'); openThread(item.threadId); }}>
          {item.title || uiText('client.taskRecovery.openThread')}
        </Button>)}
      </Space>,
    });
    // Notifications retain the result independently of the dismissed startup dialog.
    clearFailure();
    clearReadFailure();
  }, [failure, readFailed, notice, openThread, clearFailure, clearReadFailure]);
  return <>{holder}<Modal open={enabled && Boolean(recovery.snapshot?.candidates.length)} width={400} centered
    title={uiText('client.taskRecovery.title', { count: recovery.snapshot?.candidates.length ?? 0 })}
    closable={false} maskClosable={false} keyboard
    okText={uiText('client.taskRecovery.resume')} cancelText={uiText('client.taskRecovery.dismiss')}
    cancelButtonProps={{ autoFocus: true }}
    onOk={() => void recovery.decide('resume')} onCancel={() => void recovery.decide('dismiss')}>
    <p style={{ marginBlock: 0 }}>{uiText('client.taskRecovery.description')}</p>
  </Modal></>;
}
