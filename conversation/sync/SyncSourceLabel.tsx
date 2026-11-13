import { GUI_HOME_NAME, isGuiSyncHome } from './sourceLabel';
import type { SyncSource } from './types';
import styles from './sync.module.less';

export function SyncSourceLabel({ source }: { source: SyncSource }) {
  if (!isGuiSyncHome(source.home)) return <>{source.label}</>;
  return <>{source.label.slice(0, -GUI_HOME_NAME.length)}<span className={styles.guiBrand}>{GUI_HOME_NAME}</span></>;
}
