import { useState } from 'react';
import { t } from '../../localization/browserClient';
import { lastUserMessage } from '../../conversation/editMessage';
import { visibleUserContent } from '../../chat/conversationContext';
import { isMessageImage } from '../../conversation/messageEditContent';
import { MessageEditor } from '../../conversation/MessageEditor';
import { canEditRemoteMessage } from '../client/messageEdit';
import type { ChatController, ChatState, Item, Turn } from './types';
import { ChatMessage } from './ChatMessage';
import { ChatImage } from './ChatImage';
import { MessageEditInput } from './MessageEditInput';
import styles from '../../conversation/MessageEditor.module.less';

export function EditableChatMessage({ item, turn, state, controller, active }: {
  item: Item; turn: Turn; state: ChatState; controller: ChatController; active: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const last = lastUserMessage({ turns: state.selected?.turns ?? [] });
  const editable = last?.turnId === turn.id && last.item.id === item.id;
  const disabled = !active || !canEditRemoteMessage(state) || Boolean(item.localEcho);
  const parts = visibleUserContent(item.content ?? (item.text ? [item.text] : []));
  const text = parts.filter(part => part.type === 'text').map(part => part.text).join('\n');
  const target = { threadId: state.selected?.id ?? '', turnId: turn.id, itemId: item.id };
  if (!editing || !editable) return <ChatMessage item={item} desktop onOpen={() => {}}
    onEdit={editable ? () => setEditing(true) : undefined} editDisabled={disabled} />;
  return <article className={`chat-user-message-wrap ${styles.editingMessage}`}>
    <div className={styles.bubble}>
      <MessageEditor text={text} images={parts.filter(isMessageImage)}
        skills={parts.flatMap(part => part.type === 'skill' && part.path
          ? [{ name: part.name ?? '', path: part.path }] : [])}
        disabled={disabled} active={active} onCancel={() => setEditing(false)}
        onSubmit={content => controller.messageEditor.submit({ ...target, ...content })}
        onDelete={() => controller.messageEditor.remove(target)}
        renderInput={props => <MessageEditInput {...props} controller={controller} cwd={state.selected?.cwd ?? ''} />}
        renderImage={(image, index) => <ChatImage source={image.url || image.path}
          description={t('client.conversation.imageAttachment', { value1: index + 1 })} />} />
    </div>
  </article>;
}
