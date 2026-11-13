import { useMemo, type ReactNode } from 'react';
import { ImageLoaderContext } from '../conversation/useImageSource';
import { ChatImageContext } from '../remote-chat/views/ChatImage';
import { useCliGui } from './context';

/** Both desktop renderers resolve the same session-scoped image references. */
export function CliImageProvider({ children, ready }: { children: ReactNode; ready: boolean }) {
  const { controller, state } = useCliGui()!;
  const options = useMemo(() => ({ threadId: state.selected?.id ?? null, ready,
    load: controller.loadImage }), [controller, state.selected?.id, ready]);
  return <ImageLoaderContext.Provider value={controller.loadImage}>
    <ChatImageContext.Provider value={options}>{children}</ChatImageContext.Provider>
  </ImageLoaderContext.Provider>;
}
