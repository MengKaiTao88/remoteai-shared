import { useContext, useMemo, useState, type ReactNode } from 'react';
import { Button, Input } from 'antd';
import { ArrowUp, Square } from 'lucide-react';
import { uiText } from '../localization/uiText';
import { ModelPicker } from '../conversation/ModelPicker';
import { modelSelectionError } from '../conversation/modelSelection';
import { cliPickerModels } from './modelSelection';
import { ComposerDictation } from '../chat/dictation/ComposerDictation';
import type { DictationClient } from '../chat/dictation/client';
import { useGuiFontSize, guiFontStyle } from '../appearance/fontSize';
import { useDesktopLayout } from '../layout/useDesktopLayout';
import { DesktopUsageContext } from '../chat/DesktopUsageContext';
import { UsageAmounts } from '../chat/UsageAmounts';
import { ComposerContext } from '../remote-chat/views/ComposerContext';
import { ComposerFooter } from '../remote-chat/views/ComposerFooter';
import { ComposerModelPicker } from '../remote-chat/views/ComposerModelPicker';
import { useCliGui } from './context';
import { EngineSelector } from './EngineSelector';
import { CliModePicker, type CliModeClasses } from './CliModePicker';
import { CliAddContent, type CliAddClasses } from './CliAddContent';
import { CliComposerInput } from './CliComposerInput';
import { MobileCliSettings } from './MobileCliSettings';
import { ImageAttachments } from '../chat/ImageAttachments';
import { IMAGE_TYPES } from '../chat/draftImages';
import { useCliImages, type CliImageInput } from './useCliImages';
import type { ChatConnectionProps } from '../remote-chat/views/ChatProfileMenu';
import styles from '../conversation/styles.module.less';
import '../remote-chat/views/composer.css';
import '../remote-chat/views/composerDesktop.css';

export interface CliComposerProps extends CliImageInput {
  projectPicker?: ReactNode; composerHeader?: ReactNode; dictation?: DictationClient;
  remoteLayout?: boolean; active?: boolean; connectionInfo?: ReactNode;
  connection?: ChatConnectionProps; connected?: boolean;
  local?: { inputClassName: string; submitClassName: string; modeClasses: CliModeClasses; addClasses: CliAddClasses;
    status: ReactNode; footer: ReactNode; chooseFiles: (directory: boolean) => Promise<string[]> };
}

export function CliComposer({ projectPicker, composerHeader, dictation,
  remoteLayout = false, active = true, connectionInfo, local, connection, connected,
  readClipboardImages, nativeFileDrop }: CliComposerProps) {
  const { state, controller } = useCliGui()!;
  const { engine, selected, catalog, busy } = state;
  const [dictating, setDictating] = useState(false);
  const fontSize = useGuiFontSize();
  const desktop = useDesktopLayout();
  const usage = useContext(DesktopUsageContext);
  const models = useMemo(() => cliPickerModels(catalog?.models ?? []), [catalog]);
  const loading = catalog?.status !== 'ready';
  const disabled = Boolean(busy || dictating || selected?.archived);
  const scope = engine + ':' + (selected?.id ?? 'draft');
  const images = useCliImages({ controller, scope, active, disabled, local: Boolean(local),
    readClipboardImages, nativeFileDrop });
  if (engine === 'codex') return null;
  const running = selected?.status === 'running';
  const ready = state.runtime[engine]?.status === 'ready';
  const canSend = ready && !disabled && !images.reading && !running && !selected?.permissions.length && !loading
    && !modelSelectionError(models, state) && Boolean(state.draft.trim() || state.images.length);
  const refreshCatalog = async () => {
    try { await controller.refresh(); await controller.loadCatalog(); }
    catch (reason) { controller.report(reason); }
  };
  const submit = () => { if (images.isReading()) return; void (running && selected
    ? controller.act({ engine, action: 'stop', id: selected.id }) : controller.send()); };
  const status = local?.status ?? <div className="chat-composer-status">
    <div className="chat-composer-usage" role="group" aria-label={uiText('client.chatQuota.currentUsage')}>
      <ComposerContext threadId={null} ready={false} beforeOpen={() => {}} />
      <UsageAmounts scope="current" translate={uiText} />
    </div>
  </div>;
  return <>{composerHeader}<div className={remoteLayout ? 'chat-composer-dock' : styles.composerWrap}
    style={guiFontStyle(fontSize)}>
    {projectPicker ?? (!composerHeader && <div className={styles.projectBar}><Input value={selected?.cwd ?? state.cwd}
      disabled={Boolean(selected) || busy} aria-label={uiText('client.cliGui.folder')}
      placeholder={uiText('client.cliGui.folderHint')}
      onChange={event => controller.patch({ cwd: event.target.value })} /></div>)}
    <div className={remoteLayout ? 'chat-composer' : styles.composer} ref={images.target}
      {...images.drop.handlers} data-file-dragging={images.drop.dragging || undefined}>
      <input key={scope} type="file" ref={images.input} accept={IMAGE_TYPES.join(',')} multiple hidden disabled={disabled}
        aria-label={uiText('client.composer.chooseImages')} onChange={event => {
          void images.addFiles(Array.from(event.target.files ?? [])); event.target.value = '';
        }} />
      {images.error && <p role="alert" className="chat-error">{images.error}</p>}
      {images.reading && <p role="status" className="chat-muted">{uiText('client.chat.addingAttachments')}</p>}
      <ImageAttachments key={scope} images={state.images} active={active}
        disabled={disabled} onRemove={images.remove} onEdit={images.edit} />
      <CliComposerInput value={state.draft} scope={engine + ':' + (selected?.id ?? 'draft')} active={active}
        disabled={disabled} canSend={canSend} onChange={controller.edit} onSend={submit}
        onPaste={images.paste.paste} onPasteKeyDown={images.paste.pasteKeyDown}
        remote={remoteLayout} className={local?.inputClassName} />
      <div className={remoteLayout ? 'chat-composer-actions' : styles.composerControls}>
        <CliAddContent key={engine + ':' + (selected?.id ?? 'draft')}
          disabled={disabled || !active} classes={local?.addClasses} chooseFiles={local?.chooseFiles}
          chooseImages={images.choose} />
        {(!remoteLayout || desktop) && <div className={remoteLayout ? 'cli-gui-remote-mode' : styles.composerSecondary}>
          <CliModePicker engine={engine} modes={catalog?.modes ?? []} value={state.mode}
            disabled={!ready || Boolean(selected) || busy || !catalog?.modes.length}
            onChange={mode => controller.patch({ mode })} classes={local?.modeClasses} />
        </div>}
        <div className={remoteLayout ? 'chat-composer-trailing' : styles.modelControls}>
          {remoteLayout ? desktop && status : <div className={styles.composerSecondary}>{status}</div>}
          {remoteLayout && !desktop && <MobileCliSettings connection={connection} connected={connected} active={active} />}
          {remoteLayout ? desktop && <ComposerModelPicker key={engine + ':' + selected?.id} models={models}
            selection={{ model: state.model, effort: state.effort, access: 'read-only' }}
            settingsBusy={!ready || busy || Boolean(running) || Boolean(loading)} ready={ready}
            refreshModels={refreshCatalog} beforeOpen={() => {}}
            updateSettings={async selection => controller.patch({
              model: selection.model ?? state.model, effort: selection.effort ?? state.effort,
            })} /> : <ModelPicker key={engine + ':' + selected?.id} models={models} model={state.model} effort={state.effort}
              disabled={!ready || busy || Boolean(running) || loading} onRetry={refreshCatalog}
              onChange={selection => controller.patch(selection)} />}
          {dictation && <ComposerDictation client={dictation} active={active && ready} disabled={disabled || !active}
            onBusyChange={setDictating} onText={text => controller.edit(state.draft + text)} />}
          {remoteLayout ? <button type="button" className="chat-composer-submit" aria-busy={busy}
            disabled={running ? busy : !canSend} aria-label={uiText(running ? 'client.cliGui.stop' : 'client.cliGui.send')}
            onClick={submit}>{running ? <Square size={18} fill="currentColor" /> : <ArrowUp size={18} />}</button>
            : <Button type="primary" shape="circle" className={local?.submitClassName}
              icon={running ? <Square size={14} fill="currentColor" /> : <ArrowUp size={19} />}
              loading={busy} disabled={running ? busy : !canSend}
              aria-label={uiText(running ? 'client.cliGui.stop' : 'client.cliGui.send')} onClick={submit} />}
        </div>
      </div>
    </div>
    {remoteLayout ? <ComposerFooter desktop={desktop} usage={usage.usage} connectionInfo={connectionInfo}
      threadId={selected?.id} statusActive={active} /> : <div className={styles.composerHint + ' cs-usage-footer-container'}>
      <EngineSelector active={active} />{local?.footer}
    </div>}
  </div></>;
}
