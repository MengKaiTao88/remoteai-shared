import { useEffect, useRef } from 'react';
import type { LoungeController } from './controller';
import type { LoungeMessage } from './types';
import { observeGroupReadVisibility } from './groupReadVisibility';

const READ_VISIBLE_MS = 500;

export function useGroupReadObserver(options: {
  message: LoungeMessage; controller?: LoungeController; history?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { message, controller, history = false } = options;
  useEffect(() => {
    const node = ref.current;
    if (!node || !controller || !message.groupReceipt || message.recipient
      || message.sender.id === controller.snapshot().user?.id || typeof IntersectionObserver === 'undefined') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = observeGroupReadVisibility(node, visible => {
      clearTimeout(timer);
      if (visible) timer = setTimeout(() => controller.setGroupMessageVisible({ message, visible, history }),
        READ_VISIBLE_MS);
      else controller.setGroupMessageVisible({ message, visible, history });
    });
    return () => {
      clearTimeout(timer); stop();
      controller.setGroupMessageVisible({ message, visible: false, history });
    };
  }, [message, controller, history]);
  return ref;
}
