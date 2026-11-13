import { useEffect, useRef, useState } from 'react';
import type { BrowserSurfaceProps } from '../../provider-market/ProviderBrowser';

/** Browser-hosted previews cannot retain a cross-origin document when cancelling its navigation. */
export function BrowserFrame({ tab, command, onLoadingChange, t, onError }: BrowserSurfaceProps & {
  onError: () => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const current = useRef({ onLoadingChange }); current.current = { onLoadingChange };
  const lastCommand = useRef(command?.sequence ?? 0);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    current.current.onLoadingChange?.(true);
    return () => current.current.onLoadingChange?.(false);
  }, [tab.url, attempt]);
  useEffect(() => {
    if (!command || command.sequence === lastCommand.current) return;
    lastCommand.current = command.sequence;
    if (command.action !== 'stop') { setAttempt(value => value + 1); return; }
    try { frame.current?.contentWindow?.stop(); }
    catch {
      // The browser blocks cross-origin window.stop(). Blank this frame to cancel its requests;
      // the address and tab remain available for a subsequent reload.
      if (frame.current) frame.current.src = 'about:blank';
    }
    current.current.onLoadingChange?.(false);
  }, [command]);
  return <iframe ref={frame} key={attempt} src={tab.url} title={tab.title || t('market.browserNewTab')}
    sandbox="allow-scripts allow-forms allow-same-origin" referrerPolicy="no-referrer"
    onLoad={() => current.current.onLoadingChange?.(false)} onError={() => {
      current.current.onLoadingChange?.(false); onError();
    }} />;
}
