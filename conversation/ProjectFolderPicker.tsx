import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { Grid, Input, Popover, theme, type InputRef } from 'antd';
import { Check, Folder, Plus, Search, X } from 'lucide-react';
import { uiText } from "../localization/uiText";
import { folderName, type SavedProject } from './projectCatalog';
import styles from './ProjectPicker.module.less';

interface Props {
  value: string; projects: SavedProject[]; disabled: boolean;
  onChange: (cwd: string) => void; onAdd: () => void; addLabel: string;
  onOpen?: () => void; onClear?: () => void; loading?: boolean; error?: string;
  ariaLabel?: string; triggerRef?: RefObject<HTMLButtonElement>;
  onBrowse?: () => void;
}

export function ProjectFolderPicker(props: Props) {
  const { value, projects, disabled, onChange } = props;
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const browseOnAdd = !!screens.md && !!props.onBrowse;
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const fallbackTrigger = useRef<HTMLButtonElement>(null);
  const trigger = props.triggerRef ?? fallbackTrigger;
  const search = useRef<InputRef>(null);
  const list = useRef<HTMLDivElement>(null);
  const label = (path: string) => projects.find(project => project.path === path)?.name ?? folderName(path);
  const paths = [...new Set([value, ...projects.map(project => project.path)])].filter(Boolean);
  const clearable = Boolean(value && props.onClear);
  const matches = paths.filter(path => `${label(path)} ${path}`.toLocaleLowerCase()
    .includes(query.trim().toLocaleLowerCase()));
  useEffect(() => { if (disabled) setExpanded(false); }, [disabled]);
  const close = () => { setExpanded(false); trigger.current?.focus(); };
  const panel = <div ref={list} className={styles.panel} style={{ color: token.colorText,
    background: token.colorBgElevated, '--picker-muted': token.colorTextSecondary,
    '--picker-divider': token.colorSplit, '--picker-hover': token.colorFillTertiary } as CSSProperties}
    onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); close(); }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const options = Array.from(list.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    const next = current + (event.key === 'ArrowDown' ? 1 : -1);
    event.preventDefault();
    if (next < 0 || next >= options.length) search.current?.focus();
    else options[next]?.focus();
  }}>
    <Input ref={search} variant="borderless" className={styles.search} prefix={<Search size={16} />}
      aria-label={uiText("client.conversation.searchProjects")} placeholder={uiText("client.conversation.searchProjects")} value={query}
      onChange={event => setQuery(event.target.value)} />
    <div className={styles.divider} />
    <div className={styles.list} role="menu" aria-label={uiText("client.conversation.projects")} aria-busy={props.loading}>
      {matches.map(path => <button key={path} type="button" role="menuitemradio" aria-checked={value === path}
        className={styles.option} disabled={disabled} title={path}
        onClick={() => { if (!disabled) { onChange(path); close(); } }}>
        <Folder size={18} aria-hidden="true" /><span>{label(path)}</span>
        {value === path && <Check className={styles.check} size={18} aria-hidden="true" />}
      </button>)}
      {!matches.length && !props.loading && <p className={styles.empty}>
        {query.trim() ? uiText("client.conversation.noMatchingProjects") : uiText("client.conversation.noProjectsYet")}</p>}
    </div>
    {props.loading && <p role="status" className={styles.empty}>{uiText("client.workspaceActions.loadingProjects")}</p>}
    {props.error && <p role="alert" className={styles.empty}>{props.error}</p>}
    <div className={styles.divider} />
    <button type="button" className={styles.option} disabled={disabled}
      onClick={() => { setExpanded(false); if (browseOnAdd) props.onBrowse?.(); else props.onAdd(); }}>
      <Plus size={20} aria-hidden="true" /><span>{props.addLabel}</span>
    </button>
    {props.onClear && <button type="button" className={`${styles.option} ${styles.clear}`} disabled={disabled}
      onClick={() => { props.onClear?.(); close(); }}>
      <X size={18} aria-hidden="true" /><span>{uiText("client.projectPicker.workWithoutProject")}</span>
    </button>}
  </div>;
  return <span className={styles.selection}>
    {clearable && <button type="button" className={styles.clearTrigger} disabled={disabled}
      aria-label={uiText("client.conversation.clearProjectSelection")}
      title={uiText("client.conversation.clearProjectSelection")}
      onClick={() => { props.onClear?.(); close(); }}>
      <Folder className={styles.folderIcon} size={16} aria-hidden="true" />
      <X className={styles.clearIcon} size={16} aria-hidden="true" />
    </button>}
    <Popover trigger="click" placement="topLeft" arrow={false} open={expanded && !disabled} content={panel}
      onOpenChange={open => {
        setExpanded(open); if (open) { setQuery(''); props.onOpen?.(); }
      }}
      afterOpenChange={open => { if (open) search.current?.focus(); }}
      styles={{ root: { maxWidth: 400 }, body: { padding: 0, borderRadius: 20, overflow: 'hidden' } }}>
      <button ref={trigger} type="button" className={`${styles.name} ${clearable ? styles.clearableName : ''}`}
        disabled={disabled}
        aria-haspopup="menu" aria-expanded={expanded && !disabled} title={value || undefined}
        aria-label={props.ariaLabel ?? (value
          ? uiText("client.conversation.chooseProjectFolder", { value1: label(value) }) : uiText("client.conversation.chooseProjectFolder.f91460"))}>
        {!clearable && <Folder size={16} aria-hidden="true" />}
        <span>{value ? label(value) : uiText("client.chat.chooseProject")}</span>
      </button>
    </Popover>
  </span>;
}
