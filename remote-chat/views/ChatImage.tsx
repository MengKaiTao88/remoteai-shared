import { ViewportContent } from '../../chat/ViewportContent';
import { t, useLanguage } from '../../localization/browserClient';
import { createContext, useContext, useState } from 'react';
import { useChatImage, type ImagePreviewOptions } from '../client/useChatImage';
import { FileEnvironmentContext } from '../../conversation/fileEnvironment';
import { ChatImagePreview } from './ChatImagePreview';
import { useDesktopLayout } from '../../layout/useDesktopLayout';
import thumbnailStyles from '../../chat/toolImageThumbnail.module.css';
import { ImageThumbnail } from '../../chat/ImageThumbnail';
import { ImageOpenMenu } from '../../chat/ImageOpenMenu';
import { DetailsContext } from '../../conversation/detailsContext';
import { ChatFileContext } from './ChatFileLink';
import { parseFileReference } from '../../chat/fileReference';
import { chatBrowserResource } from './chatBrowserResource';
import { imageBrowserResource } from '../../file-preview/workspace/imageResource';
import { useFileMenu } from '../../conversation/useFileMenu';

export const ChatImageContext = createContext<ImagePreviewOptions | null>(null);

type ChatImageProps = { source?: string; description?: string; compact?: boolean };

export function ChatImage(props: ChatImageProps) {
  const desktop = useDesktopLayout();
  const environment = useContext(FileEnvironmentContext);
  const fixedImage = desktop || Boolean(environment);
  return <ViewportContent key={props.source} image fixedImage={fixedImage}>
    {() => <VisibleChatImage {...props} fixedImage={fixedImage} />}</ViewportContent>;
}

function VisibleChatImage({ source, description = t("client.chat.image"), compact, fixedImage }: {
  source?: string; description?: string; compact?: boolean; fixedImage: boolean;
}) {
  useLanguage();
  const environment = useContext(FileEnvironmentContext);
  const options = useContext(ChatImageContext);
  const image = useChatImage(source, options);
  const [preview, setPreview] = useState(false);
  const panel = useContext(DetailsContext);
  const files = useContext(ChatFileContext);
  const file = source ? parseFileReference(source) : undefined;
  const menu = useFileMenu(file ?? { path: '' });
  const openBrowser = () => {
    if (!panel?.openResource || !source) return;
    if (file && environment) { void menu.preview(); return; }
    if (file && files) { panel.openResource(chatBrowserResource(file.path, files)); return; }
    panel.openResource(imageBrowserResource({ key: JSON.stringify([files?.threadId, source]),
      title: description, source, load: image.original }));
  };
  if (!fixedImage && image.failed) return <span className="chat-image-notice" role="status">
    {description}{t("client.chat.couldNotLoadImage")} <button type="button" className="chat-button" onClick={image.retry}>{t("client.terminal.retry")}</button>
  </span>;
  if (!fixedImage && (image.loading || !image.url)) {
    return <span className="chat-image-notice" role="status">{t("client.chat.loadingImage")}</span>;
  }
  return <>
    {fixedImage ? <ImageThumbnail key={image.key} url={image.url} description={description} failed={image.failed}
      translate={t} retry={image.retry} onError={image.fail} onPreview={() => setPreview(true)}
      openBrowser={panel?.openResource && source ? openBrowser : undefined} className="chat-image" />
      : <ImageOpenMenu translate={t} openBrowser={panel?.openResource && source ? openBrowser : undefined}>
      <button type="button" className={`chat-image${compact ? ` ${thumbnailStyles.thumbnail}` : ''}`}
      aria-label={t("client.chat.enlarge", { value1: description })} onClick={() => setPreview(true)}>
      <img key={image.key} src={image.url} alt={description} loading="lazy" decoding="async"
        referrerPolicy="no-referrer" onError={image.fail} />
    </button></ImageOpenMenu>}
    {preview && image.url && source && <ChatImagePreview key={`preview:${image.key}`} source={source}
      thumbnail={image.url} description={description} options={options} inlineViewControls={fixedImage}
      close={() => setPreview(false)} />}
  </>;
}
