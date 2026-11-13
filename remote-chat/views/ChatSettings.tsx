import { displayError } from '../../localization/browserClient';
import { t, useLanguage } from '../../localization/browserClient';
import { useState } from 'react';
import { useDesktopLayout } from '../../layout/useDesktopLayout';
import { ChatUsage } from './ChatUsage';
import { ChatContextSettings } from './ChatContextSettings';
import { ChatProfileMenu, type ChatConnectionProps } from './ChatProfileMenu';
import { ChatSettingsFields, ChatSettingsModelSheet } from './ChatSettingsFields';
import { ChatSettingsSheet } from './ChatSettingsSheet';
import type { ContextSettingsApi } from '../contextSettings';
import type { ReadUsage } from '../usage';
import type { ReadConversationMetrics } from '../conversationMetrics';
import type { Model, ThreadTokenUsage } from './types';
import type { ComposerSettings } from '../composer';
import { composerSettingsFields, settingsNotice,
  type SettingField } from '../settingsMenu';

interface Props {
  connection: ChatConnectionProps;
  cliLocked?: boolean;
  cwd?: string;
  threadId: string | null;
  contextSettings: ContextSettingsApi;
  tokenUsage?: ThreadTokenUsage;
  readUsage: ReadUsage;
  readConversationMetrics: ReadConversationMetrics;
  models: Model[];
  selection: ComposerSettings;
  saving: boolean;
  ready: boolean;
  error: string;
  updateSettings: (settings: Partial<ComposerSettings>) => Promise<void>;
  refreshModels: () => Promise<void>;
  onClose: () => void;
}

export function ChatSettings({ models, selection, saving, ready, error, updateSettings, refreshModels, onClose,
  readUsage, readConversationMetrics, tokenUsage, threadId, contextSettings, connection,
  cliLocked = false, cwd }: Props) {
  useLanguage();
  const desktop = useDesktopLayout();
  const [field, setField] = useState<SettingField | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const notice = settingsNotice({ saving, ready, error });
  const fields = composerSettingsFields(models, selection);
  const selectInline = (field: SettingField, value: string) => {
    if (value !== selection[field] || error) void updateSettings({ [field]: value });
  };
  const choose = async (value: string) => {
    if (!field) return;
    if (value !== selection[field] || error) await updateSettings({ [field]: value });
    setField((current) => current === field ? null : current);
  };
  const usage = <ChatUsage read={readUsage} active={!field && !contextOpen} ready={ready} tokenUsage={tokenUsage}
    card={!desktop} readConversationMetrics={readConversationMetrics} threadId={threadId}
    onContextSettings={threadId ? () => setContextOpen(true) : undefined} />;
  return <ChatSettingsSheet hideHeader onClose={onClose}>
    <div className={`chat-settings${desktop ? '' : ' chat-settings-mobile'}`} aria-hidden={field !== null || contextOpen}>
      {!desktop && usage}
      <ChatProfileMenu {...connection} variant="settings" compact={!desktop} ready={ready}
        cliLocked={Boolean(threadId) || cliLocked} cliCwd={cwd} />
      <ChatSettingsFields fields={fields} compact={!desktop} inactive={field !== null || contextOpen}
        openModel={() => setField('model')} change={selectInline} />
      {!!notice && <p role={error ? 'alert' : 'status'} className={error ? 'chat-error' : 'chat-muted'}>{displayError(notice)}</p>}
      {!!error && <button type="button" className="chat-button" onClick={() => { void updateSettings(selection); }}>
        {t("client.chat.saveAgain")}</button>}
      {desktop && usage}
    </div>
    {field && <ChatSettingsModelSheet field={fields[0]} ready={ready} refresh={refreshModels}
      choose={value => { void choose(value); }} close={() => setField(null)} />}
    {contextOpen && threadId && <ChatContextSettings threadId={threadId} api={contextSettings}
      onClose={() => setContextOpen(false)} />}
  </ChatSettingsSheet>;
}
