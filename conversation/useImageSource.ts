import { uiText } from "../localization/uiText";
import { createContext, useContext, useEffect, useState } from "react";
import { guiApi } from "./api";
import { isInlineImage, localImageSource } from "./imageSources";

export const ImageThreadContext = createContext<string | null>(null);
export const ImageLoaderContext = createContext<typeof loadImage | null>(null);
const pending = new Map<string, Promise<string>>();

function loadImage(threadId: string, source: string, variant: "thumbnail" | "original"): Promise<string> {
  const key = JSON.stringify([threadId, source, variant]);
  const existing = pending.get(key);
  if (existing) return existing;
  const request = guiApi.request<{ url: string }>({ operation: "imagePreview", threadId, source, variant })
    .then(({ url }) => {
      if (!isInlineImage(url)) throw new Error(uiText("client.workspaceActions.thisImageCannotBeDisplayedRightNow"));
      return url;
    }).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}

export function useImageSource(source?: string, thumbnail?: string) {
  const threadId = useContext(ImageThreadContext);
  const load = useContext(ImageLoaderContext) ?? loadImage;
  const local = source ? localImageSource(source) : undefined;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ source: string; threadId: string; url?: string; failed?: boolean }>();
  useEffect(() => {
    if (!local || !threadId || thumbnail) return;
    let cancelled = false;
    setResult(undefined);
    void load(threadId, local, "thumbnail").then(
      (url) => { if (!cancelled) setResult({ source: local, threadId, url }); },
      () => { if (!cancelled) setResult({ source: local, threadId, failed: true }); },
    );
    return () => { cancelled = true; };
  }, [local, threadId, attempt, thumbnail, load]);
  const current = result?.source === local && result?.threadId === threadId ? result : undefined;
  const remote = source && (/^https?:\/\//i.test(source) || isInlineImage(source)) ? source : undefined;
  return { url: remote || thumbnail || current?.url, failed: current?.failed,
    original: async () => remote || (local && threadId ? load(threadId, local, "original") : ''),
    loading: Boolean(local && threadId && !thumbnail && !current), retry: () => setAttempt((value) => value + 1) };
}
