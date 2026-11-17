import { displayError } from '../../localization/browserClient';
import { t, useLanguage } from '../../localization/browserClient';
import { useRef, useState } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { Button, Input, Radio } from 'antd';
import { AdaptiveSheet } from '../../layout/AdaptiveSheet';
import { submitQuestionOnEnter } from '../../conversation/questionKeyboard';
import { pendingQuestions } from '../client/asyncQuestions';
import type { Item, Thread } from './types';
import { useDismissedQuestions } from './useDismissedQuestions';
import './asyncQuestions.css';
import { useChatSurfaceTheme } from './useChatSurfaceTheme';

interface Props {
  thread: Thread | null; disabled: boolean; error: string;
  scope: string;
  stepByStep?: boolean;
  answer: (item: Item, answers: string[]) => Promise<boolean>;
}
function QuestionFields({ questions, answers, disabled, update, visibleIndex }: {
  questions: NonNullable<Item['questions']>; answers: string[]; disabled: boolean;
  update: (index: number, value: string) => void;
  visibleIndex?: number;
}) {
  return <>{questions.map((question, index) => visibleIndex !== undefined && visibleIndex !== index ? null
    : <fieldset key={index} className="chat-question" disabled={disabled}>
    <legend>{question.title}</legend>
    {!!question.options?.length && <Radio.Group className="chat-question-options" value={answers[index]}
      disabled={disabled} onChange={event => update(index, event.target.value)}>
      {question.options.map((option, position) => <Radio key={position} value={option}>{option}</Radio>)}
    </Radio.Group>}
    <Input.TextArea aria-label={question.title}
      placeholder={t("client.composer.typeYourAnswerAndPressEnterToSend")} autoFocus={visibleIndex === index || index === 0}
      autoSize={{ minRows: 3, maxRows: 8 }} disabled={disabled}
      value={answers[index] ?? ''} onChange={event => update(index, event.target.value)} />
  </fieldset>)}</>;
}
function QuestionCard({ item, disabled, error, answer, onDelete, stepByStep }: Omit<Props, 'thread' | 'scope'> & {
  item: Item; onDelete: () => void;
}) {
  useLanguage();
  const questions = item.questions ?? [];
  const surface = useChatSurfaceTheme();
  const [questionIndex, setQuestionIndex] = useState(0);
  const lastQuestion = !stepByStep || questionIndex >= questions.length - 1;
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState(() => questions.map(question => question.options?.[0] ?? ''));
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const submitting = useRef(false);
  const submit = async () => {
    if (submitting.current || disabled || answers.some(value => !value.trim())) return;
    submitting.current = true; setBusy(true); setFailure('');
    try {
      if (await answer(item, answers)) setOpen(false);
      else setFailure(t("client.chat.yourAnswerHasNotBeenConfirmedCheckItsProgressOr"));
    } catch { setFailure(t("client.chat.couldNotSendYourAnswerPleaseTryAgain")); }
    finally { submitting.current = false; setBusy(false); }
  };
  const update = (index: number, value: string) => setAnswers(previous =>
    previous.map((entry, position) => position === index ? value : entry));
  const advance = async () => { if (answers[questionIndex]?.trim()) setQuestionIndex(value => Math.min(value + 1, questions.length - 1)); };
  return <>
    <div className="chat-question-entry">
      <button type="button" className="chat-question-open" onClick={() => setOpen(true)}
        aria-label={t("client.chat.answerFollowUpQuestion", { value1: questions[0]?.title ?? '' })}><MessageCircle size={19} />
        <span className="chat-grow"><strong>{t("client.chat.moreInformationNeeded")}</strong><small className="chat-ellipsis">
          {questions[0]?.title}</small></span><span>{t("client.chat.answer")}</span></button>
      <button type="button" className="chat-question-delete" aria-label={t("client.chat.dismissFollowUpQuestion", { value1: questions[0]?.title ?? '' })}
        disabled={busy} onClick={onDelete}><Trash2 size={16} /></button>
    </div>
    {open && <AdaptiveSheet open title={t("client.chat.moreInformationNeeded")} width={560}
      className={'chat-question-sheet' + (stepByStep ? ' assistant-question-sheet' : '')} style={surface}
      titleIcon={<MessageCircle className="chat-question-icon" size={20} />}
      onClose={() => { if (!busy) setOpen(false); }}>
      <form className="chat-question-form" aria-busy={busy}
        onSubmit={event => { event.preventDefault(); if (lastQuestion) void submit(); else advance(); }}>
        {stepByStep && questions.length > 1 && <div className="assistant-question-step">
          <button type="button" className="chat-button" disabled={busy || questionIndex === 0}
            onClick={() => setQuestionIndex(value => Math.max(0, value - 1))}>{t('client.projectBrowser.previous')}</button>
          <span>{questionIndex + 1}/{questions.length}</span>
          <button type="button" className="chat-button" disabled={busy || lastQuestion || !answers[questionIndex]?.trim()}
            onClick={advance}>{t('client.projectBrowser.next')}</button>
        </div>}
        <div className="chat-question-fields" onKeyDown={event =>
          submitQuestionOnEnter(event, lastQuestion ? submit : advance)}>
          <QuestionFields questions={questions} answers={answers} disabled={disabled || busy} update={update}
            visibleIndex={stepByStep ? questionIndex : undefined} />
        </div>
        {(error || failure) && <p role="alert" className="chat-error">{error || failure}</p>}
        <div className="chat-question-footer">
          <small>{t("client.chat.enterToSendShiftEnterForANewLine")}</small>
          <div className="chat-question-actions">
            <Button disabled={busy} onClick={() => {
              if (!submitting.current) { setOpen(false); onDelete(); }
            }}>{t("client.downloads.cancelAnswer")}</Button>
            <Button htmlType="submit" type="primary" loading={busy}
              disabled={busy || disabled || (lastQuestion ? answers.some(value => !value.trim()) : !answers[questionIndex]?.trim())}>
              {busy ? t("client.imageAi.submitting") : t(lastQuestion ? "client.chat.submitAnswer" : 'client.projectBrowser.next')}</Button>
          </div>
        </div>
      </form>
    </AdaptiveSheet>}
  </>;
}
export function ChatAsyncQuestions({ thread, scope, ...props }: Props) {
  useLanguage();
  const { dismissed, dismiss, error } = useDismissedQuestions(scope);
  const questionKey = (item: Item) => JSON.stringify([thread?.id, item.id]);
  const questions = pendingQuestions(thread).filter(item => !dismissed.has(questionKey(item)));
  if (!questions.length) return null;
  return <div className="chat-async-questions chat-scroll">
    {questions.map(item => <QuestionCard key={questionKey(item)} item={item} {...props}
      onDelete={() => dismiss(questionKey(item))} />)}
    {error && <p role="alert" className="chat-error">{displayError(error)}</p>}
  </div>;
}
