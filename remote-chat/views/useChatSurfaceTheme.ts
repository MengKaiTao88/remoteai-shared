import { theme } from 'antd';
import type { CSSProperties } from 'react';

// Portaled sheets cannot inherit the remote workspace's CSS palette.
export function useChatSurfaceTheme(): CSSProperties {
  const { token } = theme.useToken();
  return {
    '--ink': token.colorText,
    '--muted': token.colorTextSecondary,
    '--app-ink': token.colorText,
    '--app-muted': token.colorTextSecondary,
    '--app-surface': token.colorBgContainer,
    '--app-canvas': token.colorBgLayout,
    '--app-border': token.colorBorderSecondary,
    '--app-elevated': token.colorFillSecondary,
    '--app-accent': token.colorPrimaryText,
    '--app-accentSoft': token.colorPrimaryBg,
    '--app-info': token.colorInfoText,
    '--app-purple': token.purple,
    '--app-warning': token.colorWarningText,
    '--app-success': token.colorSuccessText,
    '--app-successBg': token.colorSuccessBg,
    '--app-warningBg': token.colorWarningBg,
    '--app-danger': token.colorErrorText,
    '--app-dangerBg': token.colorErrorBg,
    '--chat-menu-selected': token.controlItemBgActive,
    '--chat-menu-hover': token.controlItemBgHover,
    '--chat-menu-accent': token.colorPrimary,
  } as CSSProperties;
}
