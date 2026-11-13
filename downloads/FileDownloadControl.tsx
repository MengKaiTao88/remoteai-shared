import { displayText, displayError } from '../localization/browserClient';
import { Download, Pause, Play, Share2, X } from 'lucide-react';
import { Popover } from 'antd';
import { useState, type MouseEventHandler } from 'react';
import { t } from '../localization/browserClient';
import './fileDownload.css';

type DownloadAction = 'download' | 'cancel' | 'pause' | 'resume' | 'save';
const ACTIONS = {
  download: { label: "client.projectBrowser.download", Icon: Download }, cancel: { label: "client.downloads.cancelDownload", Icon: X },
  pause: { label: "client.downloads.pauseDownload", Icon: Pause }, resume: { label: "client.downloads.resumeDownload", Icon: Play },
  save: { label: "client.downloads.saveToDevice", Icon: Download },
};
interface Props {
  action: DownloadAction; onAction: MouseEventHandler<HTMLButtonElement>; disabled: boolean;
  progress?: { percent?: number; status: string; detail: string };
  message?: string; note?: string;
  onShare?: MouseEventHandler<HTMLButtonElement>;
  compact?: boolean;
}

function DownloadProgress({ progress }: Pick<Props, 'progress'>) {
  if (!progress) return null;
  return <div className="file-download-progress">
    <div className="file-download-progress-heading">
      <span>{displayText(progress.status)}</span>
      <strong>{progress.percent === undefined ? '—' : `${progress.percent}%`}</strong>
    </div>
    <progress max={100} value={progress.percent} aria-label={t('client.downloads.downloadProgress')} />
    {progress.detail && <p className="file-download-detail">{progress.detail}</p>}
  </div>;
}

/** Keep transfer progress separate from the action so button labels stay stable. */
export function FileDownloadControl({ action, onAction, onShare, disabled, progress, message, note, compact }: Props) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { label, Icon } = ACTIONS[action];
  const secondary = action === 'cancel' || action === 'pause';
  const messages = <>
    {message && <p role="status" className="file-download-message">{displayError(message)}</p>}
    {note && <p className="file-download-note">{displayText(note)}</p>}
  </>;
  const actions = <div className="file-download-actions">
      {onShare && <button type="button" className="file-download-action is-secondary"
        disabled={disabled} onClick={onShare} aria-label={compact ? t('client.downloads.shareFile') : undefined}>
        <Share2 size={16} aria-hidden="true" />{!compact && t("client.downloads.shareFile")}</button>}
      <button type="button" className={`file-download-action${secondary ? ' is-secondary' : ''}`}
        disabled={disabled} onClick={onAction} aria-label={compact ? displayText(label) : undefined}>
        <Icon size={compact ? 20 : 16} aria-hidden="true" />{!compact && displayText(label)}</button>
    </div>;
  if (compact) return <div className="file-download-control is-compact">
    <Popover trigger="click" placement="bottomRight" open={feedbackOpen && Boolean(progress || message || note)}
      onOpenChange={setFeedbackOpen} content={<div className="file-download-feedback">
        <DownloadProgress progress={progress} />{messages}</div>}>
      {actions}
    </Popover>
  </div>;
  return <div className="file-download-control"><DownloadProgress progress={progress} />{actions}{messages}</div>;
}
