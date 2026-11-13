import { Modal } from 'antd';
import { displayText as t } from '../localization/messages';

export function LoungeDeleteDialog({ open, busy, error, confirm, close }: {
  open: boolean; busy: boolean; error: boolean; confirm: () => void; close: () => void;
}) {
  return <Modal open={open} width={400} zIndex={1200} title={t('client.lounge.deleteTitle')}
    okText={t('client.lounge.deleteChat')} cancelText={t('client.lounge.cancel')} confirmLoading={busy}
    okButtonProps={{ danger: true, 'aria-label': t('client.lounge.deleteChat') }}
    cancelButtonProps={{ disabled: busy, 'aria-label': t('client.lounge.cancel') }}
    maskClosable={!busy} closable={!busy} onOk={confirm} onCancel={() => { if (!busy) close(); }}>
    <p>{t('client.lounge.deleteConfirm')}</p>
    {error && <p role="alert">{t('client.lounge.deleteFailed')}</p>}
  </Modal>;
}
