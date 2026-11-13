import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { displayText as t } from '../localization/messages';
import { checkFilePreviewSize, subscribeChatPolicy, textPreviewByteLimit } from '../remote-chat/policy';
import { readPdfFile } from './readPdfFile';

const PdfPreview = lazy(() => import('./PdfPreview'));

export function PdfUrlPreview({ url, name, size, remote = false }: {
  url: string; name: string; size?: number; remote?: boolean;
}) {
  const [file, setFile] = useState<Blob>();
  const [failed, setFailed] = useState(false);
  const loaded = useRef<{ url: string; file: Blob }>();
  const limit = useSyncExternalStore(subscribeChatPolicy, () => remote ? textPreviewByteLimit() : Number.MAX_SAFE_INTEGER);
  useEffect(() => {
    const controller = new AbortController();
    setFile(undefined); setFailed(false);
    void Promise.resolve().then(() => {
      if (loaded.current?.url === url) {
        if (remote) checkFilePreviewSize(loaded.current.file.size);
        return loaded.current.file;
      }
      return readPdfFile({ url, size, remote, signal: controller.signal });
    }).then(value => { if (!controller.signal.aborted) { loaded.current = { url, file: value }; setFile(value); } })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [url, size, remote, limit]);
  const feedback = <p role="status">{t(failed ? 'client.filePreview.unavailable' : 'client.projectBrowser.loading')}</p>;
  return <div className="website-file-content" data-resource-pdf>
    {file ? <Suspense fallback={feedback}><PdfPreview file={file} name={name} /></Suspense> : feedback}
  </div>;
}
