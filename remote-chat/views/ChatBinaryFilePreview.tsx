import { useEffect, useState, useSyncExternalStore } from 'react';
import { FilePreviewPanel } from '../../file-preview/workspace/FilePreviewPanel';
import { filePreviewKind } from '../../file-preview/kinds';
import type { FilePreviewData } from '../files';
import type { FilePreviewContext } from './ChatFilePreview';
import { loadVideoPreview } from './videoPreview';
import { FileDownloadButton } from '../../downloads/FileDownloadButton';
import { t } from '../../localization/browserClient';
import { subscribeChatPolicy, textPreviewByteLimit } from '../policy';

/** PDF and other binary files must never fall back to the text preview transport. */
export function ChatBinaryFilePreview({ path, context, active = true }: {
  path: string; context: FilePreviewContext; active?: boolean;
}) {
  const [data, setData] = useState<FilePreviewData>();
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const limit = useSyncExternalStore(subscribeChatPolicy,
    () => filePreviewKind(path) === 'pdf' ? textPreviewByteLimit() : 0);
  useEffect(() => {
    const controller = new AbortController();
    let dispose: (() => Promise<void>) | undefined;
    setData(undefined); setFailed(false); setProgress(0);
    if (!context.threadId || !context.ready) { setFailed(true); return; }
    void loadVideoPreview({ client: context.client, threadId: context.threadId, path, signal: controller.signal,
      progress: (received, total) => {
        if (!controller.signal.aborted) setProgress(total ? received / total * 100 : 0);
      },
    }).then(async result => {
      dispose = result.dispose;
      if (controller.signal.aborted) { await dispose(); return; }
      setData({ sessionId: '', path, name: path.split(/[\\/]/).at(-1) ?? path,
        kind: filePreviewKind(path) ?? 'text', url: result.url, text: null, remote: true });
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => { controller.abort(); void dispose?.(); };
  }, [context.client, context.threadId, context.ready, path, limit]);
  if (failed) return <p role="status" className="chat-file-preview-note">{t('client.filePreview.unavailable')}</p>;
  if (!data) return <p role="status" className="chat-file-preview-note">
    {t('client.chat.loadingFile')} {Math.round(progress)}%</p>;
  return <FilePreviewPanel data={data} active={active} embedded
    fileActions={<FileDownloadButton path={path} context={context} />} />;
}
