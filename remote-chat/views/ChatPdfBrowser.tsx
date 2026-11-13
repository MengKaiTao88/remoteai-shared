import { useContext, useEffect, useState } from 'react';
import { DetailsContext } from '../../conversation/detailsContext';
import { ProviderBrowser } from '../../provider-market/ProviderBrowser';
import { BrowserResourcesContext, ResourceBrowserSurface, fileResourceKey, fileResourceUrl }
  from '../../file-preview/workspace/browserResources';
import { useWebsiteTabs } from '../../file-preview/workspace/useWebsiteTabs';
import { guiLanguage } from '../../localization/uiText';
import { ChatBinaryFilePreview } from './ChatBinaryFilePreview';
import type { FilePreviewContext } from './ChatFilePreview';
import '../../file-preview/workspace/websitePreview.css';

/** Hosts without a sidebar still use the built-in browser and the connected computer's binary reader. */
export function ChatPdfBrowser({ path, context, active = true, onClose }: {
  path: string; context: FilePreviewContext; active?: boolean; onClose?: () => void;
}) {
  const details = useContext(DetailsContext);
  const browser = useWebsiteTabs();
  const { openResource, reset } = browser;
  const { client, threadId, ready } = context;
  const [visible, setVisible] = useState(true);
  const name = path.split(/[\\/]/).at(-1) ?? path;
  useEffect(() => {
    reset();
    openResource({ key: fileResourceKey({ path, threadId }), title: name, url: fileResourceUrl(path),
      render: props => <ChatBinaryFilePreview path={path} context={{ client, threadId, ready }}
        active={props.active} /> });
  }, [client, threadId, ready, path, name, openResource, reset]);
  useEffect(() => { if (active) setVisible(true); }, [active, path, threadId]);
  const close = () => { setVisible(false); (onClose ?? details?.close)?.(); };
  return <BrowserResourcesContext.Provider value={browser.resources}>
    <ProviderBrowser {...browser} open={active && visible} title={name} language={guiLanguage()}
      Surface={ResourceBrowserSurface}
      onClose={close} onCloseTab={id => {
        if (browser.tabs.length === 1) close(); else browser.onCloseTab(id);
      }} onCloseTabs={ids => {
        if (browser.tabs.every(tab => ids.includes(tab.id))) close(); else browser.onCloseTabs(ids);
      }} />
  </BrowserResourcesContext.Provider>;
}
