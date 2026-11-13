import type { CSSProperties, ReactNode } from 'react';
import { Spin, theme } from 'antd';
import { ChevronRight, KeyRound } from 'lucide-react';
import './accountLogin.css';

export function AccountLoginHeader({ title }: { title: string }) {
  const { token } = theme.useToken();
  return <div className="account-login-heading" style={{ fontSize: token.fontSizeHeading5,
    lineHeight: token.lineHeightHeading5, fontWeight: token.fontWeightStrong }}>
    <span className="account-login-key" style={{ color: token.colorPrimary, background: token.colorPrimaryBg }}>
      <KeyRound size={25} aria-hidden="true" />
    </span>
    <h2 style={{ margin: 0, font: 'inherit' }}>{title}</h2>
  </div>;
}

export function AccountLoginChoice({ title, description, icon, onClick, disabled, loading, featured }: {
  title: string; description: string; icon: ReactNode; onClick: () => void;
  disabled?: boolean; loading?: boolean; featured?: boolean;
}) {
  const { token } = theme.useToken();
  const style = {
    fontSize: token.fontSize, lineHeight: token.lineHeight, color: token.colorText,
    '--account-login-border': featured ? token.colorPrimaryBorder : token.colorBorder,
    '--account-login-background': featured ? token.colorPrimaryBg : token.colorBgContainer,
    '--account-login-accent': token.colorPrimary, '--account-login-soft': token.colorPrimaryBg,
    '--account-login-hover-border': token.colorPrimaryBorder, '--account-login-description': token.colorTextSecondary,
    '--account-login-secondary-size': `${token.fontSizeSM}px`,
  } as CSSProperties;
  return <button type="button" className="account-login-choice" style={style}
    disabled={disabled || loading} aria-busy={loading || undefined} onClick={onClick}>
    <span className="account-login-choice-icon">{loading ? <Spin size="small" /> : icon}</span>
    <span className="account-login-choice-copy"><b>{title}</b><small>{description}</small></span>
    <ChevronRight size={19} aria-hidden="true" />
  </button>;
}
