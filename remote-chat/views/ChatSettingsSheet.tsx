import type { CSSProperties, ReactNode } from 'react';
import { AdaptiveSheet } from '../../layout/AdaptiveSheet';
import { useDesktopLayout } from '../../layout/useDesktopLayout';
import { t, useLanguage } from '../../localization/browserClient';
import { CHAT_SETTINGS_SHEET_LAYOUT } from '../settingsPresentation';
import './chatSettings.css';

export function ChatSettingsSheet({ children, titleAction, hideHeader = false, onClose }: {
  children: ReactNode; titleAction?: ReactNode; hideHeader?: boolean; onClose: () => void;
}) {
  useLanguage();
  const desktop = useDesktopLayout();
  const layout = CHAT_SETTINGS_SHEET_LAYOUT;
  const mobileStyle = {
    maxHeight: `${layout.maxHeightPercent}dvh`,
    '--chat-settings-shared-padding': `${layout.horizontalPadding}px`,
    '--chat-settings-shared-gap': `${layout.gap}px`,
  } as CSSProperties;
  return <AdaptiveSheet open hideMobileHeader={hideHeader} className="chat-settings-sheet"
    title={t('client.chat.chatSettings.1e06eb')} titleAction={titleAction} width={400}
    style={desktop ? undefined : mobileStyle} onClose={onClose}>
    {children}
  </AdaptiveSheet>;
}
