import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Modal, Space, Table, Tag, Typography } from 'antd';
import { uiText } from '../localization/uiText';
import { useGuiLanguage } from '../localization/useGuiLanguage';
import { maskAccountEmail } from './privacy';
import { ClaudeAccountModal } from './ClaudeAccountModal';
import { claudeAccountError, type ClaudeAccountSummary, type ClaudeAccountTransport } from './claudeAccounts';

/** The connected computer owns all account state; the browser receives metadata only. */
export function ClaudeAccountsPanel({ transport, ready, privacyMode = true, add, onAdded }: {
  transport: ClaudeAccountTransport; ready: boolean; privacyMode?: boolean; add?: boolean; onAdded?: () => void;
}) {
  useGuiLanguage();
  const [accounts, setAccounts] = useState<ClaudeAccountSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [login, setLogin] = useState<{ accountId?: string }>();
  const [removing, setRemoving] = useState<ClaudeAccountSummary>();
  const generation = useRef(0);
  const pending = useRef<Promise<ClaudeAccountSummary[]>>();
  const refresh = useCallback(async () => {
    if (!ready) return;
    const expected = generation.current;
    const request = pending.current ??= transport.request<ClaudeAccountSummary[]>({ action: 'list' });
    setLoading(true);
    try {
      const accounts = await request;
      if (generation.current === expected) { setAccounts(accounts); setError(''); }
    } catch (error) {
      if (generation.current === expected) setError(claudeAccountError(error));
    } finally {
      if (pending.current === request) pending.current = undefined;
      if (generation.current === expected) setLoading(false);
    }
  }, [transport, ready]);
  useEffect(() => {
    setAccounts([]); void refresh();
    return () => { generation.current++; pending.current = undefined; };
  }, [refresh]);
  const perform = async (action: 'activate' | 'refresh' | 'delete' | 'deactivate', id: string) => {
    if (busy) return;
    setBusy(id); setError(''); setNotice('');
    try {
      await transport.request(action === 'deactivate' ? { action } : { action, id });
      if (action === 'activate') setNotice(uiText('client.officialAccounts.switched'));
      if (action === 'deactivate') setNotice(uiText('client.officialAccounts.deactivated'));
      await refresh();
    } catch (error) { setError(claudeAccountError(error)); }
    finally { setBusy(''); }
  };
  const closeLogin = () => { setLogin(undefined); onAdded?.(); };
  return <Space direction="vertical" style={{ width: '100%' }} size="middle">
    <Space wrap>
      <Typography.Text type="secondary">{uiText('client.officialAccounts.deviceHint')}</Typography.Text>
      <Button disabled={!ready || Boolean(busy)} loading={loading} onClick={() => void refresh()}>
        {uiText('client.officialAccounts.refresh')}</Button>
      <Button type="primary" disabled={!ready} onClick={() => setLogin({})}>
        {uiText('client.officialAccounts.title')}</Button>
    </Space>
    {!ready && <Alert type="info" message={uiText('client.officialAccounts.noDevice')} />}
    {error && <Alert type="error" showIcon message={error} />}
    {notice && <Alert type="success" showIcon message={notice} closable onClose={() => setNotice('')} />}
    <Table<ClaudeAccountSummary> size="small" rowKey="id" dataSource={accounts} loading={loading}
      pagination={false} scroll={{ x: 640 }} columns={[
        { title: uiText('client.accounts.accounts'), key: 'account', render: (_, account) => <Space direction="vertical" size={0}>
          <Typography.Text>{privacyMode ? maskAccountEmail(account.email) : account.email}</Typography.Text>
          <Typography.Text type="secondary">{account.plan}</Typography.Text>
          {account.usage.error && <Typography.Text type="danger">{claudeAccountError(account.usage.error)}</Typography.Text>}
        </Space> },
        { title: uiText('client.officialAccounts.source'), key: 'source', width: 120,
          render: () => <Tag>Claude Code</Tag> },
        { key: 'actions', width: 300, render: (_, account) => <Space wrap size={4}>
          <Button size="small" type={account.active ? 'default' : 'primary'} disabled={account.active || Boolean(busy)}
            onClick={() => void perform('activate', account.id)}>{account.active
              ? uiText('client.officialAccounts.current') : uiText('client.accounts.switch')}</Button>
          <Button size="small" disabled={Boolean(busy)} onClick={() => void perform('refresh', account.id)}>
            {uiText('client.officialAccounts.refresh')}</Button>
          <Button size="small" disabled={Boolean(busy)} onClick={() => setLogin({ accountId: account.id })}>
            {uiText('client.officialAccounts.reauthorize')}</Button>
          {account.active ? <Button size="small" disabled={Boolean(busy)} onClick={() => void perform('deactivate', account.id)}>
            {uiText('client.officialAccounts.deactivate')}</Button>
            : <Button size="small" danger disabled={Boolean(busy)} onClick={() => setRemoving(account)}>
                {uiText('client.officialAccounts.remove')}</Button>}
        </Space> },
      ]} />
    {ready && (login || add) && <ClaudeAccountModal transport={transport} accountId={login?.accountId}
      onClose={closeLogin} onSaved={() => { closeLogin(); void refresh(); }} />}
    <Modal open={Boolean(removing)} width={400} title={uiText('client.officialAccounts.remove')}
      okText={uiText('client.officialAccounts.remove')} cancelText={uiText('client.officialAccounts.cancel')}
      okButtonProps={{ danger: true }} onCancel={() => setRemoving(undefined)} onOk={() => {
        if (removing) void perform('delete', removing.id); setRemoving(undefined);
      }}>{uiText('client.officialAccounts.removeHint')}</Modal>
  </Space>;
}
