import { createContext, useEffect, useRef } from 'react';
import { message } from 'antd';
import type { BrowserSurfaceProps } from '../../provider-market/ProviderBrowser';
import { uiText } from '../../localization/uiText';
import { fileResourceUrl, type BrowserResource } from './browserResources';

export const ResourceFileNavigationContext = createContext<((path: string) => void) | null>(null);

function ResourcePages({ pages, open, props }: {
  pages: ReadonlyMap<string, BrowserResource>;
  open: (path: string) => Promise<BrowserResource>;
  props: BrowserSurfaceProps;
}) {
  const request = useRef(0);
  useEffect(() => () => { request.current += 1; }, []);
  useEffect(() => { request.current += 1; }, [props.tab.url]);
  const navigate = async (path: string) => {
    const id = ++request.current;
    props.onLoadingChange?.(true);
    try {
      const page = await open(path);
      if (request.current === id) props.onNavigate(page.url);
    } catch {
      if (request.current === id) void message.error({ content: uiText('client.filePreview.unavailable'),
        style: { maxWidth: 400, marginInline: 'auto' } });
    } finally {
      if (request.current === id) props.onLoadingChange?.(false);
    }
  };
  return <ResourceFileNavigationContext.Provider value={path => { void navigate(path); }}>
    {[...pages.values()].map(page => <div key={page.url} className="website-file-content"
      hidden={page.url !== props.tab.url}>
      {page.render({ ...props, active: props.active && page.url === props.tab.url,
        command: page.url === props.tab.url ? props.command : null })}
    </div>)}
  </ResourceFileNavigationContext.Provider>;
}

/** Retain documents and their sessions so returning from an image preserves page state and scroll. */
export function navigableBrowserResource(initial: BrowserResource,
  read: (path: string) => BrowserResource | Promise<BrowserResource>): BrowserResource {
  const pages = new Map([[initial.url, initial]]);
  const pending = new Map<string, Promise<BrowserResource>>();
  let closed = false;
  const open = async (path: string) => {
    const url = fileResourceUrl(path);
    const existing = pages.get(url);
    if (existing) return existing;
    if (closed) throw new Error('Resource closed');
    if (!pending.has(url)) pending.set(url, Promise.resolve().then(() => read(path)).then(page => {
      if (closed) { page.release?.(); throw new Error('Resource closed'); }
      pages.set(page.url, page);
      return page;
    }).finally(() => pending.delete(url)));
    return pending.get(url)!;
  };
  return { ...initial, page: url => pages.get(url),
    render: props => <ResourcePages pages={pages} open={open} props={props} />,
    release: () => {
      if (closed) return;
      closed = true;
      pages.forEach(page => page.release?.()); pages.clear();
    } };
}
