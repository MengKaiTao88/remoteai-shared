import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import { Modal, theme } from 'antd';
import { displayText as t } from '../localization/messages';
import { LoungeAvatar } from './LoungeAvatar';
import { accountName } from './names';
import type { LoungeController } from './controller';
import type { LoungeMessage } from './types';
import './groupReads.css';

const READERS_DIALOG_WIDTH = 360;

export function LoungeGroupReadStatus({ message, controller }: {
  message: LoungeMessage; controller: LoungeController;
}) {
  const state = useSyncExternalStore(controller.subscribe, controller.snapshot);
  const { token } = theme.useToken();
  const [open, setOpen] = useState(false);
  const overlay = useId();
  const allowed = state.policy.moderator && state.user?.id === message.sender.id && !message.recipient;
  const current = state.messages.find(item =>
    item.id === message.id && item.sender.id === message.sender.id) ?? message;
  const readers = current.delivery?.readers ?? [];
  useEffect(() => { if (!allowed) setOpen(false); }, [allowed]);
  useEffect(() => {
    controller.setGroupReadOverlay(overlay, open && allowed);
    return () => controller.setGroupReadOverlay(overlay, false);
  }, [controller, overlay, open, allowed]);
  if (!allowed || !message.groupReceipt) return null;
  return <>
    <button type="button" className={`lounge-group-read-count${readers.length ? ' is-read' : ''}`}
      style={{ fontSize: token.fontSizeSM,
        color: readers.length ? token.colorSuccessTextActive : token.colorTextSecondary }}
      onClick={() => setOpen(true)}>{t('client.lounge.groupReadCount', { count: readers.length })}</button>
    <Modal open={open && allowed} title={t('client.lounge.groupReadersTitle')} footer={null}
      width={READERS_DIALOG_WIDTH} onCancel={() => setOpen(false)}>
      <div className="lounge-group-readers">
        {!readers.length && <p>{t('client.lounge.groupReadersEmpty')}</p>}
        {readers.map(reader => <div className="lounge-group-reader" key={reader.id}>
          <LoungeAvatar user={reader} /><div><strong>{accountName(reader)}</strong>
            <span>{reader.account}</span></div>
        </div>)}
      </div>
    </Modal>
  </>;
}
