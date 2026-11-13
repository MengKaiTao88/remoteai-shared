import { t, useLanguage } from '../../localization/browserClient';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { ChatTurnFiles } from './ChatTurnFiles';
import type { Turn } from './types';
import { completedTurnFiles } from '../../chat/turnPresentation';
import { generatedImageSource } from '../../chat/imageSources';
import { ChatImage } from './ChatImage';
import { useTaskReviewAvailable } from '../TaskReviewContext';
import { ChatRetryButton } from './ChatRetryButton';
import { CapacityErrorNotice } from '../../conversation/CapacityErrorNotice';
import { isModelCapacityError } from '../../conversation/requestError';
import { processOutputs } from '../../conversation/processDetails';
import { visibleTurnRequestErrors } from '../../conversation/turnRequestErrors';

export type TurnPanel = 'plan' | 'changes' | 'error' | 'result';
export function turnErrorNotice(turn: Turn) {
  if (turn.status === 'failed' || turn.error) return t("client.chat.thisReplyStoppedBecauseOfAProblem");
  if (turn.status === 'interrupted') return t("client.chat.theConnectionWasInterruptedDuringThisReply");
  return t("client.chat.connectionInterruptedCodexIsRetrying");
}

export function ChatTurnSummary({ turn, onOpen, hideStopped = false }: {
  turn: Turn; onOpen: (panel: TurnPanel) => void; hideStopped?: boolean;
}) {
  useLanguage();
  const reviewAvailable = useTaskReviewAvailable(turn.status);
  const files = useMemo(() => completedTurnFiles(turn), [turn]);
  const generated = [...new Set(processOutputs(turn.items).filter(item => item.type === 'imageGeneration'
    && item.status === 'completed' && !item.failure).map(generatedImageSource).filter(Boolean))];
  const running = turn.status === 'inProgress';
  const requestError = visibleTurnRequestErrors(turn).at(-1);
  const capacityError = isModelCapacityError(requestError?.error);
  return <section className="chat-turn-summary">
    {generated.map(source => <ChatImage key={source} source={source} description={t("client.chat.generatedImage")} />)}
    {!!turn.plan?.length && <button type="button" className="chat-plan-summary" aria-label={t("client.chat.viewTaskPlan")}
      onClick={() => onOpen('plan')}><strong>{t("client.chat.taskPlan")}</strong>
      <span>{turn.plan.filter(step => step.status === 'completed').length}/{turn.plan.length}</span>
      <ChevronRight size={15} /></button>}
    {!!files.length && <ChatTurnFiles files={files} running={running} onOpen={() => onOpen('changes')}
      onResult={reviewAvailable ? () => onOpen('result') : undefined} />}
    {turn.status === 'interrupted' && !hideStopped && <p className="chat-muted">{t("client.chat.generationStopped")}</p>}
    {capacityError && <CapacityErrorNotice action={<ChatRetryButton turnId={turn.id} />} />}
    {!capacityError && requestError && <div className="chat-turn-error">
      <span>{turnErrorNotice(turn)} </span><span className="chat-error-actions">
        <button type="button" className="chat-error-notice" onClick={() => onOpen('error')}>
          <u>{t("client.chat.viewErrorDetails")}</u></button><ChatRetryButton turnId={turn.id} />
      </span></div>}
  </section>;
}
