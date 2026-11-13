import { useContext } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { Download, Ellipsis } from 'lucide-react';
import { ResourceDownloadCard } from '../ResourceDownloadCard';
import type { FilePreviewTarget } from './usePreviewHistory';
import { fileResourceKey, fileResourceUrl, type BrowserResource } from './browserResources';
import { useFileMenu } from '../../conversation/useFileMenu';
import { uiText } from '../../localization/uiText';
import { downloadOrigin } from '../../downloads/downloadFeedback';
import { FileMenu } from '../../conversation/FileMenu';
import { FileEnvironmentContext } from '../../conversation/fileEnvironment';
import { FileThreadContext } from '../../conversation/fileApi';

function DownloadButton({ target }: { target: FilePreviewTarget }) {
  const menu = useFileMenu(target);
  return <button className="resource-download-button" type="button" disabled={menu.busy}
    onClick={event => { void menu.perform({ type: 'saveAs' }, downloadOrigin(event)); }}>
    <Download size={17} aria-hidden="true" />{uiText('client.projectBrowser.download')}
  </button>;
}

function FileDownloadCard({ target }: { target: FilePreviewTarget }) {
  const environment = useContext(FileEnvironmentContext);
  const local = isTauri() && !environment;
  return <FileThreadContext.Provider value={target.threadId}>
    <ResourceDownloadCard path={target.path}>
      {local ? <FileMenu {...target} primaryOpen className="resource-download-button">
        <Ellipsis size={17} aria-hidden="true" />
      </FileMenu> : <DownloadButton target={target} />}
    </ResourceDownloadCard>
  </FileThreadContext.Provider>;
}

export function downloadBrowserResource(target: FilePreviewTarget): BrowserResource {
  return { key: fileResourceKey(target), title: target.path.split(/[\\/]/).at(-1) ?? target.path,
    url: fileResourceUrl(target.path), render: () => <FileDownloadCard target={target} /> };
}
