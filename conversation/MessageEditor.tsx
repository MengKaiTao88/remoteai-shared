import { useRef, useState, type ClipboardEvent, type ReactNode } from 'react';
import { Button, Popconfirm } from 'antd';
import { uiText } from '../localization/uiText';
import { remoteErrorText } from '../localization/errors';
import type { ComposerText, Content, SkillReference } from './types';
import type { SubmitMessageEdit } from './messageEditContent';
import { MessageEditorImages } from './MessageEditorImages';
import { useMessageEditDraft } from './useMessageEditDraft';
import styles from './MessageEditor.module.less';

export interface MessageEditorInputProps {
  value: ComposerText;
  onChange: (value: ComposerText) => void;
  onPaste: (event: ClipboardEvent<HTMLElement>) => void;
  onSend: () => void;
  onCancel: () => void;
  disabled: boolean;
  active: boolean;
  className: string;
}

interface Props {
  text: string;
  images: Content[];
  skills: SkillReference[];
  disabled: boolean;
  active: boolean;
  onSubmit: SubmitMessageEdit;
  onDelete?: () => Promise<boolean>;
  onCancel: () => void;
  renderInput: (props: MessageEditorInputProps) => ReactNode;
  renderImage?: (image: Content, index: number) => ReactNode;
}

/** Share draft validation, attachment handling and actions across the three desktop entry points. */
export function MessageEditor(props: Props) {
  const { disabled, active, onSubmit, onDelete, onCancel, renderInput, renderImage } = props;
  const draft = useMessageEditDraft(props);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const unavailable = disabled || !active;
  const change = async (remove: boolean) => {
    const action = remove ? onDelete : () => onSubmit(draft.content());
    if (inFlight.current || unavailable || !action) return;
    if (!remove && (draft.reading || draft.isReading() || !draft.draft.text.trim())) return;
    inFlight.current = true;
    setSaving(true);
    try {
      const success = await action();
      if (success) onCancel();
    } finally { inFlight.current = false; setSaving(false); }
  };
  return <div className={styles.editor}>
    <MessageEditorImages images={draft.images} removed={draft.removed} disabled={saving || unavailable}
      onRemove={draft.remove} renderImage={renderImage} />
    {renderInput({ value: draft.draft, onChange: draft.setDraft, onPaste: draft.paste,
      onSend: () => void change(false), onCancel, disabled: saving || unavailable,
      active, className: styles.editorInput })}
    {draft.error && <p className={styles.editorError} role="status">{remoteErrorText(draft.error)}</p>}
    <div className={styles.editorActions}>
      {onDelete && <Popconfirm title={uiText('client.messageEditing.deleteThisMessage')}
        description={uiText('client.messageEditing.thisMessageAndAllFollowingMessagesWillBeDeletedThis')}
        overlayStyle={{ maxWidth: 400 }} okText={uiText('client.projectBrowser.deleted')}
        cancelText={uiText('client.accounts.cancel')} okButtonProps={{ danger: true, autoInsertSpace: false }}
        cancelButtonProps={{ autoInsertSpace: false }} disabled={saving || unavailable}
        onConfirm={() => change(true)}>
        <Button danger className={styles.deleteButton} autoInsertSpace={false}
          disabled={saving || unavailable}>{uiText('client.messageEditing.deleteMessage')}</Button>
      </Popconfirm>}
      <Button className={styles.cancelButton} autoInsertSpace={false}
        aria-label={uiText('client.workspaceActions.cancelEditing')} disabled={saving}
        onClick={onCancel}>{uiText('client.accounts.cancel')}</Button>
      <Button className={styles.sendButton} autoInsertSpace={false} type="primary" loading={saving}
        disabled={unavailable || draft.reading || !draft.draft.text.trim()}
        onClick={() => void change(false)}>{uiText('client.conversation.sent')}</Button>
    </div>
  </div>;
}
