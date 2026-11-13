import { File, MessageSquare, Terminal, X } from 'lucide-react';
import { t } from '../../localization/browserClient';
import type { AttachmentReference } from '../../conversation/attachmentTypes';
import { ComposerAttachment } from '../../chat/ComposerAttachment';
import type { UploadProgress } from '../uploadProgress';
import { itemUploadProgress } from '../uploadProgress';
import { ChatUploadProgress } from './ChatUploadProgress';

export function ComposerAttachments({ items, busy, active, ready, uploadProgress, remove }: {
  items: AttachmentReference[]; busy: boolean; active: boolean; ready: boolean;
  uploadProgress?: UploadProgress; remove: (item: AttachmentReference) => void;
}) {
  return <div className="chat-composer-capsules">{items.map((item, index) => {
    if (item.kind === 'file' || item.kind === 'folder') return <ComposerAttachment key={`${item.path}:${index}`}
      file={{ ...item, kind: item.kind }} t={t} active={active} disabled={busy} onRemove={() => remove(item)}
      progress={item.data && <ChatUploadProgress inline reconnecting={!ready}
        progress={itemUploadProgress(uploadProgress, 'attachment', index)} />} />;
    return <span className="chat-capsule" key={`${item.path}:${index}`}>
      {item.kind === 'ssh' ? <Terminal size={14} />
        : item.kind === 'conversation' ? <MessageSquare size={14} /> : <File size={14} />}
      <span title={item.name}>{item.kind === 'conversation' && '@'}{item.kind === 'ssh' && '!'}{item.name}</span>
      <button type="button" aria-label={t('client.chat.remove', { value1: item.name })}
        disabled={busy} onClick={() => remove(item)}><X size={14} /></button></span>;
  })}</div>;
}
