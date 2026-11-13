import { displayText } from '../../localization/browserClient';
import { LoaderCircle, MoreHorizontal } from 'lucide-react';
import { threadPresentation } from '../sidebar';
import type { ChatState, Thread } from './types';
import { useThreadLongPress } from '../../chat/useThreadLongPress';
import type { ThreadActionsModel } from '../client/useThreadActions';
import { useDesktopLayout } from '../../layout/useDesktopLayout';
import { ChatThreadContextMenu } from './ChatThreadContextMenu';
import { t } from '../../localization/browserClient';
import './thread-actions.css';
import { useCliGui } from '../../cli-gui/context';

export function ChatThreadRow({ thread, state, select, actions, onFork, onOpenProject }: {
  thread: Thread; state: ChatState; select: () => void; actions: ThreadActionsModel;
  onFork: () => void; onOpenProject?: () => Promise<void>;
}) {
  const desktop = useDesktopLayout();
  const cli = useCliGui();
  const view = threadPresentation(thread, state.sidebar, displayText);
  const openActions = () => actions.open(thread);
  const gestures = useThreadLongPress(openActions, { enabled: !desktop });
  const disabled = !state.ready || state.sending;
  const row = <div className="chat-thread-row">
    <button type="button" className="chat-thread" aria-label={view.title} {...(!desktop ? gestures : {})}
      aria-haspopup={desktop ? 'menu' : 'dialog'}
      aria-current={(!cli || cli.state.engine === 'codex') && state.selected?.id === thread.id ? 'page' : undefined}
      disabled={disabled || cli?.state.busy} onClick={() => { cli?.controller.showCodex(); select(); }}>
      <span className="chat-grow chat-ellipsis">{view.title}</span>
      <span className="chat-thread-status">{view.running
        ? <LoaderCircle size={14} className="chat-spinner" aria-label={t("client.chat.replying")} />
        : view.unread && <span className="chat-unread-dot" aria-label={t("client.chat.unreadReply")} />}</span>
    </button>
    {!desktop && <button type="button" className="chat-thread-more" aria-label={t("client.threadActions.manageChat", { name: view.title })}
      aria-haspopup="dialog" disabled={disabled} onClick={openActions}><MoreHorizontal size={18} /></button>}
  </div>;
  return desktop ? <ChatThreadContextMenu thread={thread} state={state} actions={actions} onFork={onFork}
    onOpenProject={onOpenProject}>
    {row}</ChatThreadContextMenu>
    : row;
}
