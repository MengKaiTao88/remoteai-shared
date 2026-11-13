import { useMemo, type ReactNode } from 'react';
import { ChatMessages } from '../remote-chat/views/ChatMessages';
import { cliThread } from './presentation';
import type { CliHistory } from './types';

export interface CliMessagesProps {
  history: CliHistory | null; loading: boolean; loadOlder: () => Promise<void>; footer: ReactNode;
  selected: string | null; active?: boolean; scrollableComposer?: boolean;
}

export function CliMessages({ history, loading, loadOlder, footer, scrollableComposer }: CliMessagesProps) {
  const thread = useMemo(() => cliThread(history), [history]);
  return <><ChatMessages thread={thread} loading={loading} loadingMore={loading && Boolean(history)}
    hasMore={history?.hasOlder} loadOlder={loadOlder} footer={scrollableComposer ? footer : undefined} />
    {!scrollableComposer && footer}</>;
}
