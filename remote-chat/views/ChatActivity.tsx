import { displayText } from '../../localization/browserClient';
import { t, useLanguage } from '../../localization/browserClient';
import { useId, useState, type ReactNode } from 'react';
import { Brain, ChevronRight, FilePenLine, Search, SquareTerminal, Users, Wrench } from 'lucide-react';
import { ChatToolContent } from './ChatToolContent';
import type { Item } from './types';
import { messageContent, messageLabel } from '../../chat/messageDetails';
import { collaborationSummary, isCollaborationActivity }
  from '../../conversation/collaborationActivity';
import { activityFileNames, activityGroupLabel, activityGroupStatus, commandActivityLabel }
  from '../../conversation/activitySummary';

const STATUS: Record<string, string> = { get inProgress() { return t("client.chat.inProgress"); }, get completed() { return t("client.chat.completed"); }, get failed() { return t("client.taskReview.failed"); },
  get declined() { return t("client.chat.declined"); }, get interrupted() { return t("client.chat.stopped"); } };

function activityLabel(item: Item) {
  if (isCollaborationActivity(item)) return collaborationSummary(item, displayText);
  if (item.type === 'commandExecution') {
    return commandActivityLabel(item, t);
  }
  if (item.type === 'reasoning') return [...item.summary ?? [], messageContent(item)]
    .join('\n').trim().split('\n')[0].replace(/[*_`#]/g, '');
  const detail = item.type === 'fileChange'
    ? activityFileNames(item)
    : item.query || item.tool || item.review || item.text || item.path;
  return [displayText(messageLabel(item)), detail, STATUS[item.status ?? '']].filter(Boolean).join(' · ');
}

export function ChatActivity({ item, onOpen, running, inline = false, onInspect, items, content }: {
  item: Item; onOpen: (id: string) => void; running?: boolean;
  inline?: boolean; onInspect?: () => void; items?: Item[]; content?: () => ReactNode;
}) {
  useLanguage();
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const label = (items ? activityGroupLabel(items, t) : activityLabel(item))
    .slice(0, 160).replace(/\s+/g, ' ').trim();
  const status = items ? activityGroupStatus(items) : item.status;
  if (!label) return null;
  const icons = { commandExecution: SquareTerminal, fileChange: FilePenLine, reasoning: Brain, webSearch: Search };
  const Icon = isCollaborationActivity(item) ? Users : icons[item.type as keyof typeof icons] || Wrench;
  return <div className={inline ? 'chat-inline-activity' : undefined} data-status={status}>
    <button type="button" className={`chat-activity${running ? ' is-running' : ''}`}
      title={label}
      aria-label={items ? t("client.mobile.viewAllActivities", { value1: label, value2: items.length }) : undefined}
      aria-expanded={inline ? expanded : undefined} aria-controls={inline && expanded ? detailsId : undefined}
      onClick={() => {
        if (!inline) return onOpen(item.id);
        if (!expanded) onInspect?.();
        setExpanded(value => !value);
      }}><Icon size={16} color={status === 'failed' ? 'var(--danger, #c24047)' : undefined} />
      <span className="chat-activity-text">{label}</span>
      {items && status && status !== 'completed' && <small>{STATUS[status]}</small>}
      <ChevronRight size={15} /></button>
    {inline && expanded && <div id={detailsId}
      className={items ? 'chat-activity-list' : 'chat-inline-tool-content chat-detail-stack'}>
      {content ? content() : <ChatToolContent item={item} />}
    </div>}
  </div>;
}
