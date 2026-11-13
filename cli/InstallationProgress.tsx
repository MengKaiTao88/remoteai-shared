import { Progress, Spin } from 'antd';
import { uiText } from '../localization/uiText';
import { formatBytes } from '../downloads/DownloadCard';
import type { InstallationProgress as ProgressState } from './installProgressTypes';
import styles from '../conversation/styles.module.less';

const phaseKeys = {
  preparing: 'client.downloads.preparingDownload',
  downloading: 'client.downloads.downloading.e2fc57',
  installing: 'client.cliGui.installing',
  verifying: 'client.downloads.verifying',
} as const;

export function InstallationProgress({ progress }: { progress?: ProgressState | null }) {
  const phase = progress?.phase ?? 'preparing';
  const downloaded = Math.max(0, progress?.downloaded ?? 0);
  const total = progress?.total;
  const knownTotal = total !== undefined && total > 0;
  const percent = knownTotal ? Math.min(100, Math.floor(downloaded / total * 100)) : undefined;
  return <div className={styles.downloadProgress} data-install-phase={phase}>
    {percent !== undefined && <Progress percent={percent} status="active" size="small"
      aria-label={uiText('client.downloads.downloadProgress')} />}
    <span>{percent === undefined && <Spin size="small" />} {uiText(phaseKeys[phase])}</span>
    {progress?.fileName && <div style={{ overflowWrap: 'anywhere' }}>{progress.fileName}</div>}
    {(phase === 'downloading' || downloaded > 0) && <div data-install-bytes>
      {knownTotal ? `${formatBytes(downloaded)} / ${formatBytes(total)}` : formatBytes(downloaded)}
    </div>}
  </div>;
}
