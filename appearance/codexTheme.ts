import type { ThemeConfig } from 'antd';

/** This local edition uses one neutral palette across every application surface. */
export function codexThemeTokens(dark: boolean): ThemeConfig['token'] {
  return {
    colorPrimary: dark ? '#ededed' : '#242424',
    colorInfo: dark ? '#ededed' : '#242424',
    colorText: dark ? '#ececec' : '#202020',
    colorTextSecondary: dark ? '#a0a0a0' : '#777777',
    colorTextLightSolid: dark ? '#171717' : '#ffffff',
    colorBgBase: dark ? '#181818' : '#ffffff',
    colorBgContainer: dark ? '#202020' : '#ffffff',
    colorBgElevated: dark ? '#272727' : '#ffffff',
    colorBorder: dark ? '#383838' : '#e5e5e5',
    colorBorderSecondary: dark ? '#303030' : '#eeeeee',
    borderRadius: 10,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif',
  };
}
