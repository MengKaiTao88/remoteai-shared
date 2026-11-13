import { useState, type CSSProperties } from 'react';
import { Dropdown, theme } from 'antd';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { OfficialAccountSource } from './source';
import './accountSourceMenu.css';

const sources: { key: OfficialAccountSource; name: string; detail: string }[] = [
  { key: 'codex', name: 'Codex', detail: 'OpenAI · Codex CLI' },
  { key: 'claudeCode', name: 'Claude Code', detail: 'Anthropic · Claude CLI' },
];

export function AddOfficialAccountButton({ label, onSelect, className = 'primary-button' }: {
  label: string;
  onSelect: (source: OfficialAccountSource) => void;
  className?: string;
}) {
  const { token } = theme.useToken();
  const [open, setOpen] = useState(false);
  const style = {
    '--account-source-text': token.colorText,
    '--account-source-muted': token.colorTextSecondary,
    '--account-source-accent': token.colorPrimary,
    '--account-source-hover': token.colorPrimaryBg,
    '--account-source-outline': token.colorPrimaryBorder,
    '--account-source-font-size': `${token.fontSize}px`,
    '--account-source-detail-size': `${token.fontSizeSM}px`,
  } as CSSProperties;
  return <Dropdown trigger={['click']} open={open} onOpenChange={setOpen}
    placement="bottomRight" overlayClassName="account-source-dropdown" overlayStyle={style} menu={{
    items: sources.map(source => ({ key: source.key, 'aria-label': source.name,
      label: <span className="account-source-option">
        <span className={`account-source-brand account-source-brand-${source.key}`} aria-hidden="true">
          <span />
        </span>
        <span className="account-source-copy"><strong>{source.name}</strong><small>{source.detail}</small></span>
        <ChevronRight className="account-source-chevron" size={18} aria-hidden="true" />
      </span>,
    })),
    onClick: ({ key }) => { setOpen(false); onSelect(key as OfficialAccountSource); },
  }}>
    <button type="button" className={`${className} account-source-trigger`} style={style}
      aria-haspopup="menu" aria-expanded={open}>
      <Plus size={18} aria-hidden="true" />{label}<ChevronDown size={14} aria-hidden="true" />
    </button>
  </Dropdown>;
}
