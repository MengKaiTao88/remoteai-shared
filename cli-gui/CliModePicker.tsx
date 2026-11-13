import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Popover, theme } from 'antd';
import { Check, ShieldCheck } from 'lucide-react';
import { uiText } from '../localization/uiText';
import type { CliMode, ExternalEngine } from './types';
import { useLanguage } from '../localization/browserClient';
import { cliModeLabel } from './modeLabels';

export interface CliModeClasses {
  trigger: string; panel: string; heading: string; option?: string; copy?: string; check?: string;
}
const remoteClasses: CliModeClasses = { trigger: 'chat-composer-access', panel: 'chat-composer-access-menu',
  heading: 'chat-composer-access-heading' };

export function CliModePicker({ engine, modes, value, disabled, onChange, classes = remoteClasses }: {
  engine: ExternalEngine; modes: CliMode[]; value: string; disabled: boolean;
  onChange: (mode: string) => void; classes?: CliModeClasses;
}) {
  useLanguage();
  const { token } = theme.useToken();
  // Portaled remote menus cannot inherit colors from the conversation's theme wrapper.
  const panelStyle = classes === remoteClasses ? {
    '--app-ink': token.colorText, '--app-muted': token.colorTextSecondary,
    '--app-canvas': token.controlItemBgHover,
  } as CSSProperties : undefined;
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = modes.find(mode => mode.id === value);
  const label = (mode?: CliMode) => cliModeLabel(engine, mode);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  const panel = <div className={classes.panel} style={panelStyle} onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); close(); }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=menuitemradio]'));
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    let next = (current + (event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = options.length - 1;
    event.preventDefault(); options[next]?.focus();
  }}>
    <div className={classes.heading}>{uiText('client.chat.howShouldActionsBeApproved')}</div>
    <div role="menu" aria-label={uiText('client.cliGui.mode')}>
      {modes.map(mode => <button type="button" role="menuitemradio" key={mode.id} className={classes.option}
        aria-checked={value === mode.id} disabled={disabled} onClick={() => { onChange(mode.id); close(); }}>
        <ShieldCheck size={16} aria-hidden="true" /><span className={classes.copy}>{label(mode)}</span>
        {value === mode.id && <Check size={16} className={classes.check} aria-hidden="true" />}
      </button>)}
    </div>
  </div>;
  return <Popover trigger="click" placement="topLeft" arrow={false} open={open && !disabled}
    onOpenChange={setOpen} content={panel} styles={{ root: { maxWidth: 400 },
      body: { padding: 0, borderRadius: 12, overflow: 'hidden' } }}>
    <button ref={trigger} type="button" className={classes.trigger} disabled={disabled}
      aria-haspopup="menu" aria-expanded={open && !disabled}
      aria-label={uiText('client.chat.access', { value1: label(selected) })}>
      <ShieldCheck size={16} aria-hidden="true" /><span>{label(selected)}</span>
    </button>
  </Popover>;
}
