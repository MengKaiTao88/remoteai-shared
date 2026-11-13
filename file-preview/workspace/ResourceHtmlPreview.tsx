import { useContext, useLayoutEffect, useMemo, useRef } from 'react';
import { uiText } from '../../localization/uiText';
import { htmlFileUrl } from '../htmlAssets';
import { filePreviewKind } from '../kinds';
import type { FilePreviewData } from './api';
import { ResourceFileNavigationContext } from './resourceNavigation';
import styles from './preview.module.less';

function imagePath(data: FilePreviewData, value: unknown) {
  if (typeof value !== 'string') return undefined;
  try {
    const folder = new URL('.', data.url);
    const target = new URL(value);
    if (target.origin !== folder.origin || !target.pathname.startsWith(folder.pathname)) return undefined;
    const parts = target.pathname.slice(folder.pathname.length).split('/').map(decodeURIComponent);
    if (parts.some(part => !part || part === '.' || part === '..' || /[\\/:\x00-\x1f]/.test(part))) return undefined;
    const file = new URL(parts.map(encodeURIComponent).join('/'), htmlFileUrl(data.path));
    const path = decodeURIComponent(file.pathname).replace(/^\/([a-z]:\/)/i, '$1');
    return filePreviewKind(path) === 'image' ? path : undefined;
  } catch { return undefined; }
}

/** Keep the original asset URLs and opaque sandbox while forwarding image links to the owning tab. */
export function ResourceHtmlPreview({ data }: { data: FilePreviewData }) {
  const navigate = useContext(ResourceFileNavigationContext);
  const frame = useRef<HTMLIFrameElement>(null);
  const enabled = Boolean(navigate);
  const result = useMemo(() => {
    if (!enabled) return undefined;
    const channel = crypto.randomUUID();
    const url = new URL(data.url);
    url.searchParams.set('__preview_navigation', channel);
    return { url: url.href, channel };
  }, [data, enabled]);
  useLayoutEffect(() => {
    if (!result || !navigate) return;
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.channel !== result.channel
        || event.data?.type !== 'image') return;
      const path = imagePath(data, event.data.url);
      if (path) navigate(path);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [data, result, navigate]);
  return <iframe ref={frame} title={uiText('client.downloads.htmlPreview')} className={styles.frame}
    src={result?.url ?? data.url} sandbox="allow-scripts" referrerPolicy="no-referrer" />;
}
