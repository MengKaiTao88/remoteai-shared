import { useSyncExternalStore } from 'react';
import { CornerDownRight, ListOrdered } from 'lucide-react';
import { Tooltip } from 'antd';
import { uiText } from '../localization/uiText';
import { useGuiLanguage } from '../localization/useGuiLanguage';
import { isMessageQueueEnabled, saveMessageQueueEnabled, subscribeMessageQueueSettings } from './messageQueueSettings';
import './messageDeliveryMode.css';

/** Keep the behavior of a busy conversation visible beside its send controls. */
export function MessageDeliveryMode({ disabled = false }: { disabled?: boolean }) {
  useGuiLanguage();
  const queued = useSyncExternalStore(subscribeMessageQueueSettings, isMessageQueueEnabled, () => true);
  const Icon = queued ? ListOrdered : CornerDownRight;
  const label = uiText(queued ? 'client.messageQueue.queueMode' : 'client.messageQueue.steerMode');
  return <Tooltip title={uiText('client.messageQueue.description')} styles={{ root: { maxWidth: 400 } }}>
    <button type="button" className="cs-message-delivery-mode" disabled={disabled}
      aria-label={uiText('client.messageQueue.mode')} aria-pressed={queued}
      onClick={() => saveMessageQueueEnabled(!queued)}>
      <Icon size={14} aria-hidden="true" /><span>{label}</span>
    </button>
  </Tooltip>;
}
