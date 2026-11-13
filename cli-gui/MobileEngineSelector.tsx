import { useEffect, useState } from 'react';
import { Check, ChevronRight, Terminal } from 'lucide-react';
import { AdaptiveSheet } from '../layout/AdaptiveSheet';
import { t, useLanguage } from '../localization/browserClient';
import { useCliGui } from './context';
import { engineNames } from './EngineSelector';
import type { GuiEngine } from './types';

export function MobileEngineSelector({ locked = false, ready, active = true, cwd }: {
  locked?: boolean; ready: boolean; active?: boolean; cwd?: string;
}) {
  const cli = useCliGui();
  const [open, setOpen] = useState(false);
  useLanguage();
  useEffect(() => { if (!ready || !active) setOpen(false); }, [ready, active]);
  if (!cli) return null;
  const { engine, selected, busy, runtime } = cli.state;
  const fixed = locked || Boolean(selected) || busy;
  const version = engine === 'codex' ? undefined : runtime[engine]?.cliVersion;
  return <>
    <button type="button" className="chat-settings-cli" aria-label={t('client.cliGui.choose')}
      aria-expanded={open} aria-haspopup="dialog" disabled={!ready} onClick={() => setOpen(true)}>
      <Terminal size={22} /><strong>{t('client.cliGui.choose')}</strong>
      <span>{t(engineNames[engine])}{version ? ` · ${version}` : ''}</span><ChevronRight size={20} />
    </button>
    {open && <AdaptiveSheet open title={t('client.cliGui.choose')} width={400} onClose={() => setOpen(false)}>
      <div className="chat-settings chat-setting-options" role="radiogroup" aria-label={t('client.cliGui.choose')}>
        {fixed && <p className="chat-muted" style={{ maxWidth: 400 }}>{t('client.cliGui.fixedEngine')}</p>}
        {(Object.keys(engineNames) as GuiEngine[]).map(value => <button key={value} type="button" role="radio"
          className="chat-setting-option" aria-label={t(engineNames[value])} aria-checked={value === engine}
          disabled={fixed && value !== engine} onClick={() => {
            if (!fixed && cwd !== undefined) cli.controller.patch({ cwd });
            cli.controller.chooseEngine(value); setOpen(false);
          }}>
          <span className="chat-row"><strong className="chat-grow">{t(engineNames[value])}</strong>
            {value === engine && <Check size={18} />}</span>
        </button>)}
      </div>
    </AdaptiveSheet>}
  </>;
}
