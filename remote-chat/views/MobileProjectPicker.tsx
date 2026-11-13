import { ArrowLeft, ChevronDown, ChevronRight, Clock3, Download, FileText, Folder, FolderPlus,
  Monitor, Search } from 'lucide-react';
import { displayError, getLocale, t } from '../../localization/browserClient';
import { AdaptiveSheet } from '../../layout/AdaptiveSheet';
import { entryDate } from '../../project-explorer/model';
import { directoryProject, type ProjectPickerProps } from '../projectDirectories';
import { useMobileProjectPicker, type MobileProjectPickerState } from '../client/useMobileProjectPicker';
import './mobileProjectPicker.css';

const SHORTCUTS = [
  { key: 'desktop', Icon: Monitor, label: 'client.projectExplorer.desktop' },
  { key: 'downloads', Icon: Download, label: 'client.projectExplorer.downloads' },
  { key: 'documents', Icon: FileText, label: 'client.projectPicker.documents' },
] as const;

function PickerNavigation({ picker }: { picker: MobileProjectPickerState }) {
  return <>
    <div className="mobile-project-navigation">
      <button type="button" className="mobile-project-icon" aria-label={t('client.downloads.goBack')}
        disabled={picker.busy || (!picker.directory && !picker.recent)}
        onClick={() => picker.recent ? picker.toggleRecent() : picker.navigate(picker.parent)}>
        <ArrowLeft size={20} /></button>
      <button type="button" className="mobile-project-address" aria-label={t('client.projectExplorer.address')}
        aria-expanded={picker.locations} disabled={picker.busy} onClick={() => picker.setLocations(!picker.locations)}>
        <Monitor size={19} /><span>{t('client.downloads.thisComputer')}
          {picker.parts.map(part => <span key={part.path}> / {part.name.replace(/[\\/]+$/, '') || '/'}</span>)}
        </span><ChevronDown size={16} /></button>
      <button type="button" className="mobile-project-icon" aria-label={t('client.projectBrowser.newFolder')}
        disabled={!picker.canCreate} onClick={picker.openCreate}><FolderPlus size={20} /></button>
      <button type="button" className="mobile-project-icon" aria-label={t('client.projectExplorer.search')}
        aria-pressed={picker.searching} onClick={() => {
          picker.setSearching(!picker.searching); picker.setQuery('');
        }}><Search size={20} /></button>
    </div>
    {picker.locations && <nav className="mobile-project-locations" aria-label={t('client.projectExplorer.address')}>
      <button type="button" onClick={() => picker.navigate('')}>
        <Monitor size={18} />{t('client.downloads.thisComputer')}</button>
      {picker.parts.map(part => <button type="button" key={part.path} onClick={() => picker.navigate(part.path)}>
        <Folder size={18} /><span>{part.name}</span></button>)}
    </nav>}
    <div className="mobile-project-shortcuts">
      {SHORTCUTS.map(({ key, Icon, label }) => <button type="button" key={key}
        disabled={picker.busy || !picker.shortcuts?.[key]}
        onClick={() => picker.navigate(picker.shortcuts?.[key] ?? '')}>
        <Icon size={18} /><span>{t(label)}</span></button>)}
      <button type="button" aria-pressed={picker.recent} disabled={picker.busy} onClick={picker.toggleRecent}>
        <Clock3 size={18} /><span>{t('client.chat.recent')}</span></button>
    </div>
    {picker.searching && <input autoFocus type="search" className="mobile-project-input"
      aria-label={t('client.projectExplorer.search')} placeholder={t('client.projectExplorer.search')}
      value={picker.query} onChange={event => picker.setQuery(event.target.value)} />}
  </>;
}

function CreateFolder({ picker }: { picker: MobileProjectPickerState }) {
  return <form className="mobile-project-new-folder"
    onSubmit={event => { event.preventDefault(); void picker.createFolder(); }}>
    <label>{t('client.projectBrowser.newFolder')}<input autoFocus className="mobile-project-input"
      aria-label={t('client.projectBrowser.name')} value={picker.name} maxLength={255} disabled={picker.busy}
      onChange={event => picker.setName(event.target.value)} /></label>
    {picker.name && picker.invalidName && <p role="alert">{displayError(picker.invalidName)}</p>}
    {picker.actionError && <p role="alert">{displayError(picker.actionError)}</p>}
    <div><button type="button" disabled={picker.busy} onClick={picker.cancelCreate}>
      {t('client.accounts.cancel')}</button>
      <button type="submit" disabled={picker.busy || !!picker.invalidName}>
        {t('client.projectBrowser.ok')}</button></div>
  </form>;
}

export function MobileProjectPicker(props: ProjectPickerProps) {
  const picker = useMobileProjectPicker(props);
  return <AdaptiveSheet open title={props.title ?? t('client.chat.chooseProject')}
    subtitle={t('client.projectPicker.chooseLocation')} className="mobile-project-sheet"
    width={440} onClose={props.close}>
    <div className="chat-project-picker mobile-project-picker">
      <PickerNavigation picker={picker} />
      {picker.creating && <CreateFolder picker={picker} />}
      <div className="mobile-project-entries chat-scroll" aria-busy={picker.loading || picker.busy}>
        {picker.loading && !picker.recent && <p role="status">{t('client.downloads.readingFolder')}</p>}
        {!!picker.error && !picker.recent && <div><p role="alert">{displayError(picker.error)}</p>
          <button type="button" className="chat-button" onClick={picker.retry}>
            {t('client.terminal.retry')}</button></div>}
        {picker.entries.map(entry => <button type="button" key={entry.path} className="mobile-project-entry"
          aria-label={entry.name} disabled={picker.loading || picker.busy} onClick={() => picker.navigate(entry.path)}>
          <Folder size={25} /><span><strong>{entry.name}</strong><small>{picker.recent ? entry.path
            : entry.modified == null ? t('client.projectExplorer.folder')
              : entryDate({ ...entry, directory: true }, getLocale())}</small></span><ChevronRight size={19} />
        </button>)}
        {!picker.loading && (!picker.error || picker.recent) && !picker.entries.length && <p>
          {t(picker.query.trim() ? 'client.projectExplorer.noMatches'
            : picker.recent ? 'client.conversation.noProjectsYet' : 'client.chat.noSubfoldersHere')}</p>}
        {!picker.recent && picker.result?.truncated && <p>{t('client.chat.onlySomeFoldersAreShown')}</p>}
      </div>
      <div className="mobile-project-footer">
        <div className="mobile-project-current"><Folder size={21} /><span>
          <small>{t('client.projectPicker.currentPath')}</small>
          <strong>{picker.directory || t('client.downloads.thisComputer')}</strong></span></div>
        <button type="button" className="mobile-project-confirm" disabled={!picker.canChoose || picker.creating}
          onClick={() => { if (picker.result?.directory) props.choose(directoryProject(picker.result.directory)); }}>
          {t('client.projectPicker.useFolder')}</button>
      </div>
    </div>
  </AdaptiveSheet>;
}
