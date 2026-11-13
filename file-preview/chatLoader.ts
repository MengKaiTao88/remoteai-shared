import { downloadFile, type FileClient } from '../remote-chat/fileDownload';
import { checkPreviewSize, filePreviewKind, previewMimeType, type PreviewLoader } from './kinds';

export function chatPreviewLoader(client: FileClient, threadId: string): PreviewLoader {
  return async (path, options) => {
    const parts: Uint8Array[] = [];
    let mime = '';
    const pdf = filePreviewKind(path) === 'pdf';
    await downloadFile({ client, threadId, path, ...options,
      ...(pdf ? { preview: 'pdf', checkSize: (size: number) => checkPreviewSize(size, path) } as const : {}),
      target: async info => {
      checkPreviewSize(info.size, path);
      mime = info.mimeType;
      return { write: async data => { parts.push(Uint8Array.from(atob(data), char => char.charCodeAt(0))); },
        finish: async () => {}, dispose: async () => {} };
    } });
    return new Blob(parts, { type: mime && mime !== 'application/octet-stream' ? mime : previewMimeType(path) });
  };
}
