import { useState } from 'react';
import { Alert, Button, Input, Modal, Space, Typography } from 'antd';
import { ExternalLink, FolderInput, Terminal } from 'lucide-react';
import { uiText } from '../localization/uiText';
import { useGuiLanguage } from '../localization/useGuiLanguage';
import { useClaudeLogin } from './useClaudeLogin';
import type { ClaudeAccountTransport } from './claudeAccounts';
import { AccountLoginChoice, AccountLoginHeader } from './AccountLoginChoice';
import { ClaudeBrowserActions } from './ClaudeBrowserActions';

export function ClaudeAccountModal({ transport, accountId, onSaved, onClose }: {
  transport: ClaudeAccountTransport; accountId?: string; onSaved: () => void; onClose: () => void;
}) {
  useGuiLanguage();
  const login = useClaudeLogin({ transport, accountId, onSaved });
  const [code, setCode] = useState('');
  const url = login.status?.authorizationUrl;
  const pending = login.busy || login.status?.status === 'verifying';
  return <Modal open centered width={440} title={<AccountLoginHeader title={uiText('client.officialAccounts.title')} />}
    styles={{ content: { padding: 28, borderRadius: 17 } }}
    onCancel={onClose} footer={null} destroyOnClose>
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {!login.method ? <div>
        <AccountLoginChoice icon={<Terminal size={20} />} disabled={login.busy} featured
          title={uiText('client.officialAccounts.cliLogin')} description={uiText('client.officialAccounts.cliHint')}
          onClick={() => void login.start('cli')} />
        <AccountLoginChoice icon={<ExternalLink size={20} />} disabled={login.busy}
          title={uiText('client.officialAccounts.pkceLogin')} description={uiText('client.officialAccounts.pkceHint')}
          onClick={() => void login.start('pkce')} />
        {!accountId && <AccountLoginChoice icon={<FolderInput size={20} />} loading={login.busy}
          title={uiText('client.officialAccounts.import')} description={uiText('client.officialAccounts.importHint')}
          onClick={() => void login.importCurrent()} />}
      </div> : <>
        {login.method === 'pkce' && <Alert type="warning" showIcon
          message={uiText('client.officialAccounts.compatibility')} />}
        <Typography.Paragraph style={{ margin: 0 }}>{uiText(pending
          ? 'client.officialAccounts.verifying' : url ? 'client.officialAccounts.waiting'
            : 'client.officialAccounts.starting')}</Typography.Paragraph>
        <ClaudeBrowserActions url={url} />
        <label htmlFor="claude-authorization-code">{uiText('client.officialAccounts.code')}</label>
        <Input.TextArea id="claude-authorization-code" rows={3} value={code} autoComplete="off"
          spellCheck={false} onChange={event => setCode(event.target.value)} disabled={!url || pending} />
        <Button block type="primary" loading={pending} disabled={!url || !code.trim()}
          onClick={() => void login.submit(code).then(() => setCode(''))}>
          {uiText('client.officialAccounts.save')}</Button>
        <Button type="link" onClick={() => { setCode(''); login.back(); }}>
          {uiText('client.officialAccounts.back')}</Button>
      </>}
      {login.error && <Alert type="error" showIcon message={login.error} />}
    </Space>
  </Modal>;
}
