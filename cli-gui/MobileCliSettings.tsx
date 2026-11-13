import { useEffect, useState } from 'react';
import { ChatSettingsSheet } from '../remote-chat/views/ChatSettingsSheet';
import { t, useLanguage } from '../localization/browserClient';
import { ChatProfileMenu, type ChatConnectionProps } from '../remote-chat/views/ChatProfileMenu';
import { ChatSettingsFields, ChatSettingsModelSheet } from '../remote-chat/views/ChatSettingsFields';
import { ChatUsage } from '../remote-chat/views/ChatUsage';
import { useCliGui } from './context';
import { cliSettingsFields, cliSettingsPatch } from './settingsFields';
import { MobileEngineSelector } from './MobileEngineSelector';

function Settings({ connection, connected, active, close }: {
  connection?: ChatConnectionProps; connected: boolean; active: boolean; close: () => void;
}) {
  const { state, controller } = useCliGui()!;
  const [modelOpen, setModelOpen] = useState(false);
  const { engine, busy } = state;
  if (engine === 'codex') return null;
  const fields = cliSettingsFields(state, connected);
  const disabled = fields[0].disabled || Boolean(state.selected?.permissions.length);
  const refresh = async () => { await controller.refresh(); await controller.loadCatalog(); };
  return <ChatSettingsSheet hideHeader onClose={close}>
    <div className="chat-settings chat-settings-mobile" aria-hidden={modelOpen}>
      <ChatUsage card active={active && !modelOpen} ready={connected} />
      {connection ? <ChatProfileMenu {...connection} variant="settings" compact ready={connected} active={active} />
        : <div className="chat-settings-connection"><MobileEngineSelector ready={connected} active={active} /></div>}
      <ChatSettingsFields fields={fields} compact inactive={modelOpen} openModel={() => setModelOpen(true)}
        change={(field, value) => controller.patch(cliSettingsPatch(state, field, value))} />
      <button type="button" className="chat-button" disabled={disabled}
        onClick={() => { close(); void controller.install(); }}>{t('client.cliGui.update')}</button>
    </div>
    {modelOpen && <ChatSettingsModelSheet field={fields[0]} ready={connected && !busy} refresh={refresh}
      choose={value => { controller.patch(cliSettingsPatch(state, 'model', value)); setModelOpen(false); }}
      close={() => setModelOpen(false)} />}
  </ChatSettingsSheet>;
}

export function MobileCliSettings({ connection, connected = true, active = true }: {
  connection?: ChatConnectionProps; connected?: boolean; active?: boolean;
}) {
  const { state } = useCliGui()!;
  const [open, setOpen] = useState(false);
  useLanguage();
  useEffect(() => { setOpen(false); }, [state.engine, state.selected?.id, active]);
  const model = state.catalog?.models.find(entry => entry.id === state.model);
  const name = model?.label || t('client.shared.syncingModels');
  return <>
    <button type="button" className="chat-model" aria-haspopup="dialog" aria-expanded={open}
      aria-label={t('client.mobile.chatSettings', { value1: name })} onClick={() => setOpen(true)}>
      <span className="chat-model-name">{name}</span>
      <span className="chat-model-effort">{model?.efforts?.find(entry => entry.id === state.effort)?.label}</span>
    </button>
    {open && active && <Settings connection={connection} connected={connected} active={active}
      close={() => setOpen(false)} />}
  </>;
}
