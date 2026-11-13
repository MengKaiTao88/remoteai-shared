import { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal } from 'antd';
import { Copy, ExternalLink } from 'lucide-react';
import { copyText } from '../clipboard';
import { invoke, isDesktopApp } from '../platform/localBackend';
import { uiText } from '../localization/uiText';

export function ClaudeBrowserActions({ url }: { url?: string }) {
  const [chooseMode, setChooseMode] = useState(false);
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setChooseMode(Boolean(url)); setManual(false); setCopied(false); setError('');
  }, [url]);
  if (!url) return null;
  const open = async (privateMode: boolean) => {
    setError(''); setBusy(true);
    try {
      if (isDesktopApp) {
        const opened = await invoke<boolean>('open_claude_authorization', { url, privateMode });
        setManual(!opened);
      } else if (privateMode) setManual(true);
      else { window.open(url, '_blank', 'noopener,noreferrer'); setManual(false); }
      setChooseMode(false);
    } catch { setError(uiText('client.officialAccounts.openBrowserFailed')); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    try { await copyText(url); setCopied(true); setError(''); }
    catch { setError(uiText('client.officialAccounts.copyLinkFailed')); }
  };
  return <>
    <Button block icon={<ExternalLink size={16} />} onClick={() => setChooseMode(true)}>
      {uiText('client.officialAccounts.openBrowser')}
    </Button>
    {manual && <div className="claude-browser-manual">
      <Alert type="info" showIcon message={uiText('client.officialAccounts.privateBrowserManual')} />
      <Input readOnly value={url} aria-label={uiText('client.officialAccounts.authorizationLink')}
        onFocus={event => event.target.select()} />
      <Button icon={<Copy size={14} />} onClick={() => void copy()}>
        {uiText(copied ? 'client.officialAccounts.linkCopied' : 'client.officialAccounts.copyLink')}
      </Button>
    </div>}
    {error && !chooseMode && <Alert type="error" showIcon message={error} />}
    <Modal open={chooseMode} centered width={400} title={uiText('client.officialAccounts.browserModeTitle')}
      onCancel={() => { if (!busy) setChooseMode(false); }} closable={!busy} maskClosable={!busy}
      footer={[
        <Button key="normal" disabled={busy} onClick={() => void open(false)}>
          {uiText('client.officialAccounts.browserNormal')}
        </Button>,
        <Button key="private" type="primary" disabled={busy} onClick={() => void open(true)}>
          {uiText('client.officialAccounts.browserPrivate')}
        </Button>,
      ]}>
      <p>{uiText('client.officialAccounts.browserModeHint')}</p>
      {error && <Alert type="error" showIcon message={error} />}
    </Modal>
  </>;
}
