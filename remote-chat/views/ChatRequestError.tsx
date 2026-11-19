import { t, useLanguage } from '../../localization/browserClient';
import { CapacityErrorNotice } from '../../conversation/CapacityErrorNotice';
import { isModelCapacityError } from '../../conversation/requestError';
import { visibleTurnRequestErrors, type TurnRequestError } from '../../conversation/turnRequestErrors';
import type { Turn } from './types';
import { ChatRetryButton } from './ChatRetryButton';

/** Request failures are timeline entries, independent of collapsible work and turn summaries. */
export function ChatRequestError({ turn, record, onOpen }: {
  turn: Turn; record: TurnRequestError; onOpen: () => void;
}) {
  useLanguage();
  const action = !record.willRetry && record.id === visibleTurnRequestErrors(turn).at(-1)?.id
    ? <ChatRetryButton turnId={turn.id} /> : null;
  return <div data-request-error={record.id}>
    {isModelCapacityError(record.error) ? <CapacityErrorNotice action={action} />
      : <div className="chat-turn-error">
        <span role="status">{record.willRetry ? t('client.chat.connectionInterruptedCodexIsRetrying')
          : t('client.chat.thisReplyStoppedBecauseOfAProblem')} </span>
        <span className="chat-error-actions">
          <button type="button" className="chat-error-notice" onClick={onOpen}>
            <u>{t('client.chat.viewErrorDetails')}</u></button>{action}
        </span>
      </div>}
  </div>;
}
