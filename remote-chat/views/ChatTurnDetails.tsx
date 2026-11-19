import { t, useLanguage } from '../../localization/browserClient';
import { CheckCircle2, Circle, LoaderCircle } from 'lucide-react';
import type { Turn } from './types';
import { AdaptiveSheet } from '../../layout/AdaptiveSheet';
import { completedTurnFiles } from '../../chat/turnPresentation';
import { requestErrorDetails } from '../../conversation/requestError';
import { turnErrorNotice, type TurnPanel } from './ChatTurnSummary';
import { ChatMarkdown } from './ChatMarkdown';
import { ChatDiff } from './ChatDiff';
import { ChatCodeBlock } from './ChatCodeBlock';
import { TaskReviewPanel } from '../../task-review/views/TaskReviewPanel';
import { visibleTurnRequestErrors } from '../../conversation/turnRequestErrors';
import { useEffect } from 'react';

const TITLES = { get plan() { return t("client.chat.taskPlan"); }, get changes() { return t("client.chat.changesThisTurn"); },
  get error() { return t("client.chat.errorDetails"); }, get result() { return t("client.taskReview.taskReview"); } };
export function ChatTurnDetails({ turn, panel, onClose, tabId, errorId }: {
  turn: Turn; panel: TurnPanel; onClose: () => void; tabId?: string; errorId?: string;
}) {
  useLanguage();
  const errors = visibleTurnRequestErrors(turn);
  const requestError = errorId ? errors.find(error => error.id === errorId) : errors.at(-1);
  useEffect(() => {
    if (panel === 'error' && !requestError) onClose();
  }, [panel, requestError, onClose]);
  if (panel === 'error' && !requestError) return null;
  const error = requestError?.error;
  return <AdaptiveSheet open tabId={tabId} title={TITLES[panel]} width={760} onClose={onClose}
    presentation={panel === 'changes' || panel === 'result' ? 'drawer' : 'adaptive'}>
    <div className="chat-detail-stack">
      {panel === 'result' && <TaskReviewPanel key={turn.id} turn={turn} />}
      {panel === 'changes' && <ChatDiff files={completedTurnFiles(turn)} />}
      {panel === 'error' && <ChatCodeBlock label={t("client.chat.errorDetails")} copyLabel={t("client.chat.copyErrorDetails")}
        text={error ? requestErrorDetails(error) : turnErrorNotice(turn)} wrapMode="always" />}
      {panel === 'plan' && <>
        {turn.planExplanation && <ChatMarkdown text={turn.planExplanation} />}
        {turn.plan?.map((step, index) => {
          const Icon = step.status === 'completed' ? CheckCircle2 : step.status === 'inProgress' ? LoaderCircle : Circle;
          const label = { completed: t("client.chat.completed"), inProgress: t("client.chat.inProgress"), pending: t("client.chat.pending") }[step.status] || t("client.chat.pending");
          return <div className="chat-plan-step" key={index}><Icon size={17} />
            <span>{step.step}</span><small>{label}</small></div>;
        })}
      </>}
    </div>
  </AdaptiveSheet>;
}
