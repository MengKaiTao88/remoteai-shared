import { uiText } from "../localization/uiText";
import { ViewportContent } from '../chat/ViewportContent';
import { useContext, useState } from "react";
import { FileEnvironmentContext } from './fileEnvironment';
import { MessageImagePreview } from './MessageImagePreview';
import { ImageThumbnail } from '../chat/ImageThumbnail';
import { useImageSource } from "./useImageSource";
import { isTauri } from "@tauri-apps/api/core";
import { isHostedWebApp } from "../platform/localBackend";
import { FileMenu } from "./FileMenu";
import { parseFileReference } from "./fileReference";
import { DetailsContext } from './detailsContext';
import { FileThreadContext } from './fileApi';
import { useFileMenu } from './useFileMenu';
import { imageBrowserResource } from '../file-preview/workspace/imageResource';

interface MessageImageProps { src?: string; alt?: string; title?: string; compact?: boolean }

export function MessageImage(props: MessageImageProps) {
  const environment = useContext(FileEnvironmentContext);
  return environment ? environment.image(props)
    : <ViewportContent key={props.src} image fixedImage>{() => <LocalMessageImage {...props} />}</ViewportContent>;
}

function LocalMessageImage({ src, alt, title }: MessageImageProps) {
  const panel = useContext(DetailsContext);
  const threadId = useContext(FileThreadContext);
  const [failedSource, setFailedSource] = useState<string>();
  const [preview, setPreview] = useState(false);
  const image = useImageSource(src);
  const description = alt?.trim() || uiText("client.chat.image");
  const file = src && (isTauri() || isHostedWebApp) ? parseFileReference(src) : undefined;
  const menu = useFileMenu(file ?? { path: '' });
  const openBrowser = () => {
    if (!panel?.openResource || !src) { setPreview(true); return; }
    if (file && menu.canPreview) { void menu.preview(); return; }
    panel.openResource(imageBrowserResource({ key: JSON.stringify([threadId, src]), title: description,
      source: src, load: image.original }));
  };
  const failed = !image.loading && (!image.url || image.failed || failedSource === image.url);
  return <>
    <ImageThumbnail url={image.url} description={description} title={title} failed={failed} translate={uiText}
      retry={() => { setFailedSource(undefined); image.retry(); }} onError={() => setFailedSource(image.url)}
      onPreview={() => setPreview(true)} openBrowser={panel?.openResource && src ? openBrowser : undefined} fallback={file
        ? <FileMenu {...file} preview>{uiText('client.composer.previewFile')}</FileMenu> : undefined} />
    {preview && image.url && src && <MessageImagePreview key={src} source={src}
      thumbnail={image.url} description={description} close={() => setPreview(false)} />}
  </>;
}
