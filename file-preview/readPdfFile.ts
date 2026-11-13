import { checkFilePreviewSize } from '../remote-chat/policy';

/** Check metadata before fetching, then count actual decoded bytes when servers omit or understate the length. */
export async function readPdfFile(options: {
  url: string; signal: AbortSignal; size?: number; remote: boolean;
}): Promise<Blob> {
  const check = (size: number) => { if (options.remote) checkFilePreviewSize(size); };
  if (options.size !== undefined) check(options.size);
  const response = await fetch(options.url, { signal: options.signal });
  if (!response.ok) throw new Error('PDF unavailable');
  const length = response.headers.get('Content-Length');
  try { if (length !== null) check(Number(length)); }
  catch (error) {
    await response.body?.cancel().catch(() => console.warn('PDF transfer cleanup failed'));
    throw error;
  }
  const reader = response.body?.getReader();
  if (!reader) {
    const file = await response.blob(); check(file.size); return file;
  }
  const parts: Uint8Array[] = [];
  let received = 0;
  try {
    for (;;) {
      options.signal.throwIfAborted();
      const chunk = await reader.read();
      if (chunk.done) break;
      received += chunk.value.byteLength; check(received); parts.push(chunk.value);
    }
    check(received);
    return new Blob(parts, { type: 'application/pdf' });
  } finally {
    await reader.cancel().catch(() => console.warn('PDF transfer cleanup failed'));
    reader.releaseLock();
  }
}
