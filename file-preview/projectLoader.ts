import { toByteArray } from 'base64-js';
import { downloadProjectEntry } from '../project-browser/downloads';
import type { ProjectBrowserClient } from '../project-browser/protocol';
import { checkPreviewSize, filePreviewKind, previewMimeType, type PreviewLoader } from './kinds';

export function projectPreviewLoader(client: ProjectBrowserClient, cwd: string): PreviewLoader {
  const load: PreviewLoader = async (path, options) => {
    if (!client.transfer) throw new Error('client.filePreview.unavailable');
    const parts: Uint8Array[] = [];
    let mime = '';
    const pdf = filePreviewKind(path) === 'pdf';
    const checkSize = (size: number) => checkPreviewSize(size, path, client.previewMode);
    await downloadProjectEntry({ client: client.transfer, file: { cwd, path }, transferId: crypto.randomUUID(),
      ...(pdf ? { preview: 'pdf', checkSize } as const : {}),
      ...options, target: async info => {
        checkSize(info.size);
        mime = info.mimeType;
        return { write: async data => { parts.push(toByteArray(data)); },
          finish: async () => {}, dispose: async () => {} };
      } });
    return new Blob(parts, { type: mime && mime !== 'application/octet-stream' ? mime : previewMimeType(path) });
  };
  load.mode = client.previewMode;
  return load;
}
