import { useState } from 'react';
import { Button, Checkbox, Input, Radio } from 'antd';
import { uiText } from '../localization/uiText';
import type { CliPermission, CliRequest, CliSession } from './types';
import { ShieldQuestion } from 'lucide-react';
import styles from '../conversation/styles.module.less';

export function CliPermissions({ session, busy, respond, remoteLayout = false }: {
  session: CliSession; busy: boolean; respond: (request: CliRequest) => Promise<void>; remoteLayout?: boolean;
}) {
  return <div className={remoteLayout ? 'chat-approvals chat-scroll' : `${styles.approvals} ${styles.questionWrap}`}>
    {session.permissions.map(permission => <Permission key={permission.id} permission={permission}
      remoteLayout={remoteLayout}
      busy={busy} submit={(actionId, answers) => respond({ engine: session.engine, action: 'approve',
        id: session.id, permissionId: permission.id, actionId, answers })} />)}
  </div>;
}

function Permission({ permission, busy, submit, remoteLayout }: {
  permission: CliPermission; busy: boolean; remoteLayout: boolean;
  submit: (action: string, answers?: Record<string, string>) => Promise<void>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answer = (question: string, value: string) => setAnswers(previous => ({ ...previous, [question]: value }));
  const complete = permission.questions?.every(question => answers[question.question]?.trim()) ?? true;
  return <section className={remoteLayout ? 'chat-approval' : styles.approval} aria-label={uiText('client.cliGui.approval')}>
    {remoteLayout ? <h2>{uiText('client.chat.yourApprovalIsNeeded')}</h2>
      : <strong><ShieldQuestion size={17} />{uiText('client.chat.yourApprovalIsNeeded')}</strong>}
    <p className={remoteLayout ? 'chat-muted' : undefined}>{permission.title}</p>
    {permission.description && <p className={remoteLayout ? 'chat-muted' : undefined}>{permission.description}</p>}
    {permission.questions?.map(question => <fieldset key={question.question} disabled={busy}>
      <legend>{question.question}</legend>
      {question.options.length > 0 && (question.multiple
        ? <Checkbox.Group options={question.options} onChange={values => answer(question.question, values.join(', '))} />
        : <Radio.Group options={question.options} value={answers[question.question]}
          onChange={event => answer(question.question, event.target.value)} />)}
      <Input value={answers[question.question] ?? ''} onChange={event => answer(question.question, event.target.value)}
        aria-label={question.question} />
    </fieldset>)}
    <div className={remoteLayout ? 'chat-row' : styles.approvalActions}>{permission.actions.map(action => remoteLayout
      ? <button key={action.id} type="button" className={'chat-button' + (action.behavior === 'allow' ? ' chat-primary' : '')}
        disabled={busy || action.behavior === 'allow' && !complete}
        onClick={() => { void submit(action.id, permission.questions?.length ? answers : undefined); }}>
        {action.label || uiText(action.behavior === 'allow' ? 'client.cliGui.allow' : 'client.cliGui.deny')}
      </button> : <Button key={action.id}
      type={action.behavior === 'allow' ? 'primary' : 'default'} disabled={busy || action.behavior === 'allow' && !complete}
      onClick={() => { void submit(action.id, permission.questions?.length ? answers : undefined); }}>
      {action.label || uiText(action.behavior === 'allow' ? 'client.cliGui.allow' : 'client.cliGui.deny')}
    </Button>)}</div>
  </section>;
}
