import { Globe } from 'lucide-react';
import type { BrowserTab } from './browserState';
import { ProviderWebsiteIcon } from './ProviderWebsiteIcon';

/** Match the Chrome assistant's cursor for conversation-owned browser tabs. */
export function BrowserTabIcon({ tab }: { tab: BrowserTab }) {
  if (tab.automationThread) {
    return <svg className="pm-browser-controlled-icon" width={14} height={14} viewBox="0 0 32 32"
      aria-hidden="true">
      <path d="M7 3v24l7-7 5 10 5-2-5-10h9L7 3Z" fill="white" stroke="#16a34a"
        strokeWidth={2.5} strokeLinejoin="round" />
    </svg>;
  }
  return <ProviderWebsiteIcon url={tab.url} size={14} fallback={<Globe size={14} />} />;
}
