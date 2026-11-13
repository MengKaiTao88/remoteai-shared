import { useEffect, useRef } from 'react';
import type { RemoteFilePreviewProps } from '../../conversation/DetailsWorkspace';
import { PreviewNavigation } from '../../file-preview/workspace/PreviewNavigation';
import styles from '../../file-preview/workspace/preview.module.less';
import { ChatFilePreviewContent, type FilePreviewContext } from './ChatFilePreview';
import { t, useLanguage } from '../../localization/browserClient';
import './remoteFilePreview.css';

/** Keep remote reads and downloads bound to the connected computer inside the shared drawer. */
export function ChatRemoteFilePreview({ target, active, navigation, context }: RemoteFilePreviewProps & {
  context: FilePreviewContext;
}) {
  useLanguage();
  const host = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!active) host.current?.querySelectorAll('video, audio').forEach(element => {
      (element as HTMLMediaElement).pause();
    });
  }, [active]);
  return <section ref={host} className={styles.window} aria-label={t("client.projectBrowser.filePreview")}>
    <header className={styles.toolbar}>
      <PreviewNavigation navigation={navigation} />
      <div className={styles.heading}>
        <strong>{target.path.split(/[\\/]/).at(-1) || t("client.projectBrowser.filePreview")}</strong><span>{target.path}</span>
      </div>
    </header>
    <div className="chat-remote-file-preview">
      <ChatFilePreviewContent path={target.path} line={target.line} active={active}
        context={{ ...context, threadId: target.threadId }} />
    </div>
  </section>;
}
