import { useRef, useState } from 'react';
import { Copy, Download, LoaderCircle } from 'lucide-react';
import { ImageViewerFrame } from '../chat/ImageViewerFrame';
import { ThreadContextMenu } from '../chat/ThreadContextMenu';
import { displayText as t } from '../localization/messages';
import { saveLoungeImage } from './saveImage';
import { copyLoungeImage } from './clipboard';
import './contextMenu.css';

export function LoungePreview({ uri, close }: { uri: string; close: () => void }) {
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [feedback, setFeedback] = useState('');
  const copy = async () => {
    setMenuOpen(false);
    if (busy.current) return;
    busy.current = true;
    setCopying(true); setFailed(false);
    setFeedback(t('client.workspaceActions.copyingImage'));
    try {
      await copyLoungeImage(uri);
      setFeedback(t('client.workspaceActions.imageCopied'));
    } catch { setFeedback(t('client.workspaceActions.couldNotCopyTheImagePleaseTryAgain')); }
    finally { busy.current = false; setCopying(false); }
  };
  const save = async () => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true); setFailed(false); setFeedback('');
    try { await saveLoungeImage(uri); }
    catch { setFailed(true); }
    finally { busy.current = false; setSaving(false); }
  };
  const label = t(saving ? 'client.projectBrowser.saving' : 'client.shared.downloadImage');
  return <ImageViewerFrame src={uri} description={t('client.lounge.previewImage')}
    onEscape={menuOpen ? () => setMenuOpen(false) : undefined}
    close={close} translate={t} naturalSize renderStage={stage => <ThreadContextMenu
      open={menuOpen} onOpenChange={setMenuOpen} overlayClassName="lounge-context-menu"
      getPopupContainer={target => target.closest('dialog') ?? target}
      menu={{ items: [{ key: 'copy', label: t('client.workspaceActions.copyImage'),
        icon: <Copy size={16} />, disabled: saving || copying }], onClick: () => void copy() }}>
      <div className="lounge-preview-menu-target" tabIndex={0}>{stage}</div>
    </ThreadContextMenu>}>
    <button type="button" className="cs-image-download" disabled={saving || copying} aria-busy={saving}
      aria-label={label} onClick={() => void save()}>
      {saving ? <LoaderCircle size={24} className="cs-image-download-spinner" aria-hidden="true" />
        : <Download size={24} aria-hidden="true" />}<span>{label}</span>
    </button>
    {failed && <div className="cs-image-status" role="status">
      {t('client.workspaceActions.couldNotSaveTheImagePleaseTryAgain')}</div>}
    {feedback && <div className="cs-image-status" role="status">{feedback}</div>}
  </ImageViewerFrame>;
}
