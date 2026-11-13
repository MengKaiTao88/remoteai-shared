import { t, useLanguage } from '../../localization/browserClient';
import { AdaptiveSheet } from '../../layout/AdaptiveSheet';
import type { WorkEntry } from '../../chat/turnPresentation';
import { toolText } from '../../chat/toolText';
import { ChatActivity } from './ChatActivity';
import { ChatMessage } from './ChatMessage';
import { ChatToolContent } from './ChatToolContent';
import { ChatQuoteButton } from './ChatQuotes';
import './workDrawer.css';
import { DeferredProcessDetails } from '../../chat/DeferredProcessDetails';
import { processActivityCount } from '../../conversation/processDetails';

export function ChatWorkDrawer({ entry, onClose }: {
  entry: Pick<WorkEntry, 'turn' | 'items'>; onClose: () => void;
}) {
  useLanguage();
  const running = entry.turn.status === 'inProgress';
  return <AdaptiveSheet open mobileFullscreen className="chat-work-drawer"
    title={running ? t('client.chat.working') : t('client.chat.activity')}
    subtitle={t('client.chat.actions', { value1: processActivityCount(entry.items) })} width={760} onClose={onClose}>
    <DeferredProcessDetails items={entry.items}>{items => <div className="chat-detail-stack">{items.map(item =>
      ['userMessage', 'agentMessage'].includes(item.type)
        ? <ChatMessage key={item.id} item={item} process onOpen={onClose} onQuote={onClose}
          running={running && item.status !== 'completed'} />
        : <ChatActivity key={item.id} item={item} inline onOpen={onClose}
          running={running && item.status === 'inProgress'} content={() => <>
            <ChatToolContent item={item} />
            <ChatQuoteButton messageId={item.id} role="tool" text={toolText(item)} onQuote={onClose} />
          </>} />)}</div>}</DeferredProcessDetails>
  </AdaptiveSheet>;
}
