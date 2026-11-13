import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { t } from '../../localization/browserClient';
import type { MessageEditorInputProps } from '../../conversation/MessageEditor';
import type { ChatController, Skill } from './types';
import { composerTrigger, editSkillDraft, insertDraftSkill } from '../client/skillDraft';
import { ChatCommandMenu } from './ComposerMenus';
import { ComposerContextMenu } from '../../chat/ComposerContextMenu';
import { useChatCatalog } from './useChatCatalog';
import styles from '../../conversation/MessageEditor.module.less';

export function MessageEditInput({ controller, cwd, ...props }: MessageEditorInputProps & {
  controller: ChatController; cwd: string;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  const composing = useRef(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [dismissed, setDismissed] = useState('');
  const trigger = composerTrigger(props.value.text, selection);
  const triggerKey = trigger ? JSON.stringify(trigger) : '';
  const open = props.active && !props.disabled && Boolean(triggerKey) && triggerKey !== dismissed;
  const catalog = useChatCatalog(controller, cwd, open);
  const close = () => setDismissed(triggerKey);
  useEffect(() => { input.current?.focus(); }, []);
  useLayoutEffect(() => {
    const node = input.current;
    if (!node) return;
    const resize = () => { node.style.height = 'auto'; node.style.height = `${node.scrollHeight}px`; };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [props.value.text]);
  const choose = (skill: Skill) => {
    if (!trigger) return;
    props.onChange(insertDraftSkill(props.value, trigger, skill));
    close();
    const caret = trigger.start + skill.name.length + 2;
    requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(caret, caret); });
  };
  return <div className={styles.inputWrap}>
    {open && <div className={`chat-composer-popover ${styles.skillMenu}`}>
      <ChatCommandMenu input={input} catalog={catalog} query={trigger?.query ?? ''} skillsOnly
        compactReason={null} choose={choose} compact={close} goal={close} close={close} />
    </div>}
    <ComposerContextMenu scope={`message-edit:${cwd}`} active={props.active} translate={t}>
    <textarea ref={input} value={props.value.text} rows={2} className={props.className}
      aria-label={t('client.conversation.editMessage')} disabled={props.disabled} onPaste={props.onPaste}
      placeholder={t('client.workspaceActions.typeAMessageOrToChooseASkill')}
      onChange={event => props.onChange(editSkillDraft(props.value, event.target.value))}
      onSelect={event => setSelection({ start: event.currentTarget.selectionStart,
        end: event.currentTarget.selectionEnd })}
      onCompositionStart={() => { composing.current = true; }}
      onCompositionEnd={() => { composing.current = false; }}
      onKeyDown={event => {
        if (event.defaultPrevented || props.disabled || !props.active || composing.current
          || event.nativeEvent.isComposing || event.keyCode === 229) return;
        if (event.key === 'Escape') { event.preventDefault(); props.onCancel(); }
        if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); props.onSend(); }
      }} />
    </ComposerContextMenu>
  </div>;
}
