import { useMemo } from 'react';
import { fileResourceKey, fileResourceUrl, type BrowserResource }
  from '../../file-preview/workspace/browserResources';
import { filePreviewKind } from '../../file-preview/kinds';
import { ChatFilePreviewContent, type FilePreviewContext } from './ChatFilePreview';
import { ChatFileContext } from './ChatFileLink';
import { ChatBinaryFilePreview } from './ChatBinaryFilePreview';
import { isDownloadOnlyFile } from '../filePreview';
import { ResourceDownloadCard } from '../../file-preview/ResourceDownloadCard';
import { FileDownloadButton } from '../../downloads/FileDownloadButton';
import { navigableBrowserResource } from '../../file-preview/workspace/resourceNavigation';

function ChatResourceContent({ path, line, context, active }: {
  path: string; line?: number; context: FilePreviewContext; active: boolean;
}) {
  const nestedContext = useMemo(() => ({ ...context, basePath: path }), [context, path]);
  const kind = filePreviewKind(path);
  const binary = kind && kind !== 'html' && kind !== 'markdown';
  if (isDownloadOnlyFile(path, { mediaPreview: true })) return <ResourceDownloadCard path={path}>
    <FileDownloadButton path={path} context={context} />
  </ResourceDownloadCard>;
  return <ChatFileContext.Provider value={nestedContext}>
    {binary ? <ChatBinaryFilePreview path={path} context={context} active={active} />
      : <ChatFilePreviewContent path={path} line={line} context={context} />}
  </ChatFileContext.Provider>;
}

function chatBrowserPage(path: string, context: FilePreviewContext, line?: number): BrowserResource {
  return { key: fileResourceKey({ path, threadId: context.threadId, line }),
    title: path.split(/[\\/]/).at(-1) ?? path, url: fileResourceUrl(path),
    render: props => <ChatResourceContent path={path} line={line} context={context} active={props.active} /> };
}

export function chatBrowserResource(path: string, context: FilePreviewContext, line?: number): BrowserResource {
  return navigableBrowserResource(chatBrowserPage(path, context, line), next => chatBrowserPage(next, context));
}
