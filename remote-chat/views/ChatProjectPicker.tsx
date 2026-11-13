import { t, useLanguage, getLocale } from '../../localization/browserClient';
import { Grid } from 'antd';
import { ProjectExplorer } from '../../project-explorer/ProjectExplorer';
import type { ProjectPickerProps } from '../projectDirectories';
import { MobileProjectPicker } from './MobileProjectPicker';

export function ChatProjectPicker(props: ProjectPickerProps) {
  useLanguage();
  const screens = Grid.useBreakpoint();
  return screens.md ? <ProjectExplorer {...props} t={t} locale={getLocale()} /> : <MobileProjectPicker {...props} />;
}
