import { displayText, t } from '../../localization/browserClient';
import { AdaptiveSheet } from '../../layout/AdaptiveSheet';
import type { SettingsFieldState } from '../settingsMenu';
import { ChatSettingSegments } from './ChatSettingSegments';
import { ModelRefreshButton } from './ModelRefreshButton';

export function ChatSettingsFields({ fields, compact, inactive, openModel, change }: {
  fields: SettingsFieldState[]; compact: boolean; inactive: boolean; openModel: () => void;
  change: (field: SettingsFieldState['field'], value: string) => void;
}) {
  return <>{fields.map(entry => entry.field !== 'model'
    ? <ChatSettingSegments key={entry.field} {...entry} label={displayText(entry.label)} compact={compact}
      inactive={inactive} disabled={entry.disabled} onChange={value => change(entry.field, value)} />
    : <button key={entry.field} type="button" className="chat-setting-entry"
      aria-label={t('client.chat.set', { value1: displayText(entry.label) })}
      onClick={openModel} disabled={entry.disabled} tabIndex={inactive ? -1 : 0}>
      <strong>{displayText(entry.label)}</strong><span>
        {entry.options.find(option => option.value === entry.value)?.label || entry.value || t('client.app.syncing')}
      </span><span aria-hidden="true">›</span>
    </button>)}</>;
}

export function ChatSettingsModelSheet({ field, ready, refresh, choose, close }: {
  field: SettingsFieldState; ready: boolean; refresh: () => Promise<void>;
  choose: (value: string) => void; close: () => void;
}) {
  return <AdaptiveSheet open title={t('client.shared.chooseModel')} width={400}
    titleAction={<ModelRefreshButton ready={ready} refreshModels={refresh} />} onBack={close} onClose={close}>
    <div className="chat-settings chat-setting-options" role="radiogroup">
      {field.options.map(option => <button key={option.value} type="button" role="radio"
        aria-label={option.label} aria-checked={field.value === option.value} disabled={field.disabled}
        className="chat-setting-option" onClick={() => choose(option.value)}>
        <span className="chat-row"><strong className="chat-grow">{option.label}</strong>
          {field.value === option.value && <span aria-hidden="true">✓</span>}</span>
        {option.description && <small>{displayText(option.description)}</small>}
      </button>)}
    </div>
  </AdaptiveSheet>;
}
