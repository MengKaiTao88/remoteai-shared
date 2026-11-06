import type { ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { useApplicationFontSize } from './useApplicationFontSize';
import './typography.css';
import { useCodexAppearance } from './useCodexAppearance';
import { codexThemeTokens } from './codexTheme';

export function ApplicationTypography({ children }: { children: ReactNode }) {
  const fontSize = useApplicationFontSize();
  const dark = useCodexAppearance();
  return <ConfigProvider theme={{ token: { ...codexThemeTokens(dark), fontSize } }}>{children}</ConfigProvider>;
}
