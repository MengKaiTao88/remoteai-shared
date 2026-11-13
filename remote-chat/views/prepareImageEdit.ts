import { validateChatImages } from '../attachments';
import { pickChatImages } from './pickChatImages';
import type { ConnectionMode } from '../protocol';

export async function prepareImageEdit(source: string, mode?: ConnectionMode) {
  if (source.startsWith('data:')) {
    try { validateChatImages([source], mode); return source; }
    catch { /* Reuse attachment compression when the original exceeds the send limit. */ }
  }
  if (!/^(data:image\/|blob:|https?:\/\/)/i.test(source)) throw new Error('Unsupported image');
  const response = await fetch(source, { credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!response.ok) throw new Error('Image unavailable');
  const blob = await response.blob();
  const [image] = await pickChatImages([new File([blob], 'image.png', { type: blob.type })], 1);
  return image.url;
}
