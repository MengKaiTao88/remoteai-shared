import { useEffect, useState } from 'react';
import { Button, Input, Modal, Popover, Segmented } from 'antd';
import { ImagePlus, Paperclip, Plus } from 'lucide-react';
import { uiText } from '../localization/uiText';
import { useCliGui } from './context';

export interface CliAddClasses { trigger: string; panel: string; heading?: string; option?: string }
export function CliAddContent({ disabled, classes, chooseFiles, chooseImages }: {
  disabled: boolean; classes?: CliAddClasses; chooseFiles?: (directory: boolean) => Promise<string[]>;
  chooseImages: () => void;
}) {
  const cli = useCliGui()!;
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [folder, setFolder] = useState(false);
  const [path, setPath] = useState('');
  const [choosing, setChoosing] = useState(false);
  const addLabel = uiText(classes ? 'client.shared.add' : 'client.chat.addContent');
  useEffect(() => { if (disabled) { setOpen(false); setDialog(false); } }, [disabled]);
  const add = (paths: string[]) => {
    const current = cli.controller.getSnapshot();
    if (current.engine !== cli.state.engine || current.selected?.id !== cli.state.selected?.id) return;
    const references = paths.map(value => JSON.stringify(value)).join('\n');
    cli.controller.edit([current.draft, references].filter(Boolean).join('\n'));
    setDialog(false); setPath('');
  };
  const browse = async () => {
    if (!chooseFiles || choosing) return;
    setChoosing(true);
    try { const paths = await chooseFiles(folder); if (paths.length) add(paths); }
    catch { cli.controller.report('client.cliGui.requestFailed'); }
    finally { setChoosing(false); }
  };
  const menu = <div className={classes?.panel ?? 'chat-add-menu'} role="menu" aria-label={addLabel}
    onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); } }}>
    {classes?.heading && <div className={classes.heading}>{uiText('client.shared.add')}</div>}
    <button type="button" role="menuitem" className={classes?.option}
      onClick={() => { setOpen(false); chooseImages(); }}>
      <ImagePlus size={19} /><span>{uiText('client.composer.chooseImages')}</span>
    </button>
    <button type="button" role="menuitem" className={classes?.option}
      onClick={() => { setOpen(false); setDialog(true); }}>
      <Paperclip size={19} /><span>{uiText('client.composer.filesAndFolders')}</span>
    </button>
  </div>;
  return <>
    <Popover trigger="click" placement="topLeft" arrow={false} open={open && !disabled} onOpenChange={setOpen}
      content={menu} styles={{ root: { maxWidth: 400 }, body: { padding: 0, borderRadius: 20, overflow: 'hidden' } }}>
      <button type="button" className={classes?.trigger ?? 'chat-composer-add'} disabled={disabled}
        aria-label={addLabel} aria-haspopup="menu" aria-expanded={open && !disabled}>
        <Plus size={classes ? 21 : 18} strokeWidth={classes ? 1.6 : 2} aria-hidden="true" />
      </button>
    </Popover>
    <Modal open={dialog} centered width={400} title={uiText('client.composer.addFilesAndFolders')}
      footer={null} onCancel={() => setDialog(false)} closable={!choosing} maskClosable={!choosing} keyboard={!choosing}>
      <div className="cli-gui-file-reference">
        <Segmented value={folder ? 'folder' : 'file'} options={[{ label: uiText('client.chat.files.39932f'), value: 'file' },
          { label: uiText('client.git.folders'), value: 'folder' }]} onChange={value => setFolder(value === 'folder')} />
        <Input value={path} onChange={event => setPath(event.target.value)}
          aria-label={uiText('client.composer.attachmentPath')} placeholder={uiText('client.composer.enterTheFullPath')}
          onPressEnter={() => { if (path.trim()) add([path.trim()]); }} />
        <p>{uiText('client.composer.enterThePathToAFileOrFolderOnThe')}</p>
        <div className="chat-row">
          {chooseFiles && <Button loading={choosing} onClick={() => { void browse(); }}>
            {uiText(folder ? 'client.composer.addFolder' : 'client.composer.addFile')}</Button>}
          <Button type="primary" disabled={!path.trim() || choosing} onClick={() => add([path.trim()])}>
            {uiText('client.shared.add')}</Button>
        </div>
      </div>
    </Modal>
  </>;
}
