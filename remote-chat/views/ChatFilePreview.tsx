import { displayError } from '../../localization/browserClient';
import { t, useLanguage } from '../../localization/browserClient';
import { useEffect, useState } from 'react';
import { Grid } from 'antd';
import { Code2, Eye } from 'lucide-react';
import { AdaptiveSheet } from '../../layout/AdaptiveSheet';
import { isMarkdownPath, type TextPreview } from '../textPreview';
import type { FileClient } from '../fileDownload';
import { isVideoPath } from '../video';
import { ChatCodeBlock } from './ChatCodeBlock';
import { ChatCopyButton } from './ChatCopyButton';
import { JsonPreview } from '../../file-preview/JsonPreview';
import { isJsonPath } from '../../file-preview/jsonHighlightLimit';
import { ChatMarkdownPreview } from './ChatMarkdownPreview';
import { ChatHtmlPreview, isHtmlPath } from './ChatHtmlPreview';
import { ChatImage } from './ChatImage';
import { loadVideoPreview } from './videoPreview';
import { FileDownloadButton } from '../../downloads/FileDownloadButton';
import { ImageFileDownload } from './ImageFileDownload';
import { localImageSource } from '../../chat/imageSources';
import type { PreviewLoadOptions, PreviewProgress } from '../previewProgress';
import { PreviewTransferProgress } from '../../chat/PreviewTransferProgress';
import { ChatDownloadFile, isDownloadOnlyFile } from './ChatDownloadFile';
import { ChatFileContext } from './ChatFileLink';
import { filePreviewError } from '../fileErrors';
import { filePreviewKind } from '../../file-preview/kinds';
import { ChatPdfBrowser } from './ChatPdfBrowser';
import './filePreview.css';

export interface FilePreviewContext {
  client: FileClient; threadId: string | null; ready: boolean;
  basePath?: string;
  load?: (threadId: string, path: string, options?: PreviewLoadOptions) => Promise<TextPreview>;
}
function TextFile({ path, context, line, source }: {
  path: string; context: FilePreviewContext; line?: number; source?: boolean;
}) {
  useLanguage();
  const [result, setResult] = useState<TextPreview>();
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<PreviewProgress>();
  useEffect(() => {
    const observer = new AbortController();
    setResult(undefined); setError(''); setProgress(undefined);
    if (!context.threadId || !context.load || !context.ready) { setError(t("client.chat.connectToYourComputerToPreviewThisFile")); return; }
    void context.load(context.threadId, path, { signal: observer.signal,
      onProgress: value => { if (!observer.signal.aborted) setProgress(value); },
    }).then(value => { if (!observer.signal.aborted) setResult(value); })
      .catch(cause => {
        if (!observer.signal.aborted) setError(displayError(filePreviewError(cause, "暂时无法预览此文件，可以下载后查看。")));
      });
    return () => { observer.abort(); };
  }, [context.load, context.threadId, context.ready, path]);
  if (error) return <p className="chat-file-preview-note" role="status">{displayError(error)}</p>;
  if (!result) return <PreviewTransferProgress progress={progress} label={t("client.chat.loadingFile")} />;
  return <>{line && <p className="chat-muted">{t("client.shared.referencedLine", { line })}</p>}
    {isHtmlPath(path) ? <ChatHtmlPreview text={result.text} path={result.path} source={source}
      client={context.client} threadId={context.threadId!} />
      : isMarkdownPath(path) ? <ChatMarkdownPreview text={result.text} source={source} />
      : isJsonPath(path) ? <><ChatCopyButton text={result.text} label={t('client.chat.copyFileContents')} />
        <JsonPreview text={result.text} size={result.size} line={line} /></>
      : <ChatCodeBlock text={result.text} language={path.split('.').at(-1)} label={path.split(/[\\/]/).at(-1)}
        copyLabel={t("client.chat.copyFileContents")} />}</>;
}
function VideoFile({ path, context }: { path: string; context: FilePreviewContext }) {
  useLanguage();
  const [url, setUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    let loaded: Awaited<ReturnType<typeof loadVideoPreview>> | undefined;
    if (!context.threadId || !context.ready) { setError(t("client.chat.connectToYourComputerToPreviewThisFile")); return; }
    void loadVideoPreview({ client: context.client, threadId: context.threadId, path, signal: controller.signal,
      progress: (received, total) => { if (!controller.signal.aborted) setProgress(Math.round(received / total * 100)); },
    }).then(async result => {
      loaded = result;
      if (controller.signal.aborted) await result.dispose();
      else setUrl(result.url);
    }).catch(cause => {
      if (!controller.signal.aborted) setError(cause instanceof Error && cause.message === t("client.chat.thisVideoIsLargeDownloadItToPlay")
        ? cause.message : t("client.chat.videoPreviewUnavailableDownloadItToPlay"));
    });
    return () => { controller.abort(); void loaded?.dispose(); };
  }, [context.client, context.threadId, context.ready, path]);
  if (error) return <p role="status" className="chat-error">{displayError(error)}</p>;
  if (!url) return <p role="status" className="chat-muted">{t("client.chat.preparingVideo")} {progress}%</p>;
  return <video controls playsInline src={url} style={{ width: '100%', maxHeight: '60dvh' }}
    onError={() => setError(t("client.chat.yourBrowserCannotPlayThisFormatDownloadTheVideoTo"))} />;
}
export function ChatFilePreviewContent({ path, line, context, active = true, showDownload = true, source }: {
  path: string; line?: number; context: FilePreviewContext; active?: boolean; showDownload?: boolean;
  source?: boolean;
}) {
  useLanguage();
  if (filePreviewKind(path) === 'pdf') return <ChatPdfBrowser path={path} context={context} active={active} />;
  const image = /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(path);
  return <ChatFileContext.Provider value={{ ...context, basePath: path }}>
    <div className="chat-detail-stack">
      {showDownload && (localImageSource(path) ? <ImageFileDownload path={path} />
        : <FileDownloadButton path={path} context={context} />)}
      {image ? <ChatImage source={path} description={t("client.projectBrowser.filePreview")} />
      : isVideoPath(path) ? <VideoFile path={path} context={context} />
        : <TextFile key={path} path={path} context={context} line={line} source={source} />}</div>
  </ChatFileContext.Provider>;
}

export function ChatFilePreview({ path, line, context, onClose }: {
  path: string; line?: number; context: FilePreviewContext; onClose: () => void;
}) {
  useLanguage();
  const screens = Grid.useBreakpoint();
  const mobile = !screens.md;
  const [source, setSource] = useState(false);
  const modeLabel = source ? t('client.chat.preview')
    : t(isHtmlPath(path) ? 'client.downloads.source' : 'client.chat.source');
  if (filePreviewKind(path) === 'pdf') return <ChatPdfBrowser path={path} context={context} onClose={onClose} />;
  if (isDownloadOnlyFile(path)) return <ChatDownloadFile path={path} context={context} onClose={onClose} />;
  return <AdaptiveSheet open truncateTitle title={path.split(/[\\/]/).at(-1) || t("client.projectBrowser.filePreview")}
    className="chat-file-preview-sheet" mobileFullscreen
    titleAction={mobile && <div className="chat-file-preview-actions">
      {(isHtmlPath(path) || isMarkdownPath(path)) && <button type="button"
        className="sheet-close chat-file-preview-mode" aria-label={modeLabel} title={modeLabel}
        disabled={!context.ready || !context.threadId} onClick={() => setSource(value => !value)}>
        {source ? <Eye size={20} aria-hidden="true" /> : <Code2 size={20} aria-hidden="true" />}
      </button>}
      {localImageSource(path) ? <ImageFileDownload path={path} compact />
        : <FileDownloadButton path={path} context={context} compact />}
    </div>}
    width={800} onClose={onClose}>
    <ChatFilePreviewContent path={path} line={line} context={context} showDownload={!mobile}
      source={mobile ? source : undefined} />
  </AdaptiveSheet>;
}
