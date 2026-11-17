import { t } from '../../localization/browserClient';
import { CommandOutput } from '../../chat/CommandOutput';
import { ChatCopyButton } from './ChatCopyButton';
import { activityStatus } from '../../conversation/itemStatus';
import type { Item } from './types';

/** One bounded output region avoids nested command/output scrollers on phones. */
export function ChatShellOutput({ item }: { item: Item }) {
  const status = activityStatus(item);
  return <section className="chat-shell-card" data-status={status}>
    <header><strong>{t('client.configLabels.shellTool')}</strong><small>{t(status === 'failed' ? 'client.taskReview.failed'
      : status === 'interrupted' ? 'client.chat.stopped' : status === 'inProgress'
        ? 'client.chat.inProgress' : 'client.chat.completed')}</small></header>
    <CommandOutput command={item.command ?? ''} label={t('client.chat.command')}
      output={item.aggregatedOutput || t(status === 'inProgress' ? 'client.chat.waitingForOutput' : 'client.chat.noTextOutput')}
      copyCommand={<ChatCopyButton text={item.command ?? ''} label={t('client.chat.copyCommand')} iconOnly />}
      copyOutput={<ChatCopyButton text={item.aggregatedOutput ?? ''} label={t('client.chat.copyOutput')} iconOnly />} />
    {item.exitCode != null && <footer>{t('client.chat.exitCode')}{item.exitCode}</footer>}
  </section>;
}
