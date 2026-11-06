import { useRef, type ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { codexThemeTokens } from './codexTheme';
import { useCodexAppearance } from './useCodexAppearance';
import './codexAppearance.css';

/** Chat styling and its portals stay inside the workspace, including when retained offscreen. */
export function CodexAppearance({ children }: { children: ReactNode }) {
  const dark = useCodexAppearance();
  const scope = useRef<HTMLDivElement>(null);
  return <div ref={scope} data-codex-appearance data-theme={dark ? 'dark' : 'light'}
    style={{ display: 'contents' }}>
    <ConfigProvider theme={{ token: codexThemeTokens(dark) }}
      getPopupContainer={trigger => trigger?.closest<HTMLElement>('[data-codex-appearance]')
        ?? scope.current ?? document.body}>
      {children}
    </ConfigProvider>
  </div>;
}
