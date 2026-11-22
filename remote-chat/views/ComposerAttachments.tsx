import { Box, File, MessageSquare, Terminal, X } from 'lucide-react';
import { t } from '../../localization/browserClient';
import type { AttachmentReference } from '../../conversation/attachmentTypes';
import { ComposerAttachment } from '../../chat/ComposerAttachment';
import type { UploadProgress } from '../uploadProgress';
import { itemUploadProgress } from '../uploadProgress';
import { ChatUploadProgress } from './ChatUploadProgress';

const REFERENCE_ICONS = { conversation: MessageSquare, ssh: Terminal, plugin: Box, coze: File };

export function ComposerAttachments({ items, busy, active, ready, uploadProgress, remove }: {
  items: AttachmentReference[]; busy: boolean; active: boolean; ready: boolean;
  uploadProgress?: UploadProgress; remove: (item: AttachmentReference) => void;
}) {
  return <div className="chat-composer-capsules">{items.map((item, index) => {
    if (item.kind === 'file' || item.kind === 'folder') return <ComposerAttachment key={`${item.path}:${index}`}
      file={{ ...item, kind: item.kind }} t={t} active={active} disabled={busy} onRemove={() => remove(item)}
      progress={item.data && <ChatUploadProgress inline reconnecting={!ready}
        progress={itemUploadProgress(uploadProgress, 'attachment', index)} />} />;
    const Icon = REFERENCE_ICONS[item.kind];
    return <span className="chat-capsule" key={`${item.path}:${index}`}>
      <Icon size={14} aria-hidden="true" />
      <span title={item.name}>{item.kind === 'conversation' && '@'}{item.kind === 'ssh' && '!'}{item.name}</span>
      <button type="button" aria-label={t('client.chat.remove', { value1: item.name })}
        disabled={busy} onClick={() => remove(item)}><X size={14} /></button></span>;
  })}</div>;
}
