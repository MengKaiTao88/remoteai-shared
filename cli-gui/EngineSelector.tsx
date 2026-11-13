import { Dropdown, Tooltip } from 'antd';
import { Check, ChevronDown } from 'lucide-react';
import { uiText } from '../localization/uiText';
import { useLanguage } from '../localization/browserClient';
import type { GuiEngine } from './types';
import './cliGui.css';
import { useCliGui } from './context';
import { CodexVersionStatus } from '../codex-status/CodexVersionStatus';
import type { ReadCodexServiceStatus } from '../codex-status/status';

export const engineNames = {
  codex: 'client.cliGui.codex', claude: 'client.cliGui.claude', gemini: 'client.cliGui.gemini',
} as const satisfies Record<GuiEngine, string>;

function engineItem(id: GuiEngine, selected: GuiEngine, fixed: boolean) {
  const disabled = fixed && id !== selected;
  const name = uiText(engineNames[id]);
  return {
    key: id, disabled, className: disabled ? 'cli-gui-disabled-engine-option' : undefined,
    label: disabled ? <Tooltip placement="right" title={uiText('client.cliGui.fixedEngine')}
      styles={{ root: { maxWidth: 400 } }}>
      <span className="cli-gui-disabled-engine-label">{name}</span>
    </Tooltip> : name,
    icon: id === selected ? <Check size={14} /> : <span />,
  };
}

export function EngineSelector({ version, locked = false, read, active = true, connected = true }: {
  version?: string | null; locked?: boolean; read?: ReadCodexServiceStatus; active?: boolean; connected?: boolean;
}) {
  useLanguage();
  const context = useCliGui();
  const engine = context?.state.engine ?? 'codex';
  const cliVersion = engine === 'codex' ? version : context?.state.runtime[engine]?.cliVersion;
  const fixed = locked || Boolean(context?.state.selected) || context?.state.busy;
  if (!context) return <CodexVersionStatus version={version} read={read} active={active} connected={connected} t={uiText} />;
  const selector = <Dropdown trigger={['click']} placement="topLeft" menu={{
    selectedKeys: [engine], selectable: true,
    items: (Object.keys(engineNames) as GuiEngine[]).map(id => engineItem(id, engine, Boolean(fixed))),
    onClick: ({ key }) => context.controller.chooseEngine(key as GuiEngine),
  }}>
    <button type="button" className="cli-gui-engine"
      aria-label={uiText('client.cliGui.choose')} aria-haspopup="menu">
      <span>{uiText(engineNames[engine])} · {cliVersion || uiText('client.cliGui.versionUnknown')}</span>
      <ChevronDown size={13} aria-hidden="true" />
    </button>
  </Dropdown>;
  return engine === 'codex' ? <CodexVersionStatus label={selector} read={read}
    active={active} connected={connected} t={uiText} /> : selector;
}
