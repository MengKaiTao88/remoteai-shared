import { ExternalLink } from 'lucide-react';
import { isTauri } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { message } from 'antd';
import { uiText } from '../localization/uiText';
import type { ExternalEngine } from './types';
import { useCliGui } from './context';

// Keep installation entry points on the vendors' official domains on every host.
export const officialInstallUrls: Record<ExternalEngine, string> = {
  claude: 'https://code.claude.com/docs/en/setup#install-claude-code',
  gemini: 'https://geminicli.com/docs/get-started/installation/',
};

export function CliInstallLink({ engine, officialOnly = false }: { engine: ExternalEngine; officialOnly?: boolean }) {
  const url = officialInstallUrls[engine];
  const cli = useCliGui();
  const installing = cli?.state.runtime[engine]?.status === 'installing';
  return <span className="cli-gui-install-link">
    {!officialOnly && <button type="button" className="chat-text-action" disabled={installing || cli?.state.busy}
      onClick={() => { void cli?.controller.install(); }}>
      {uiText(installing ? 'client.cliGui.installing' : cli?.state.runtime[engine]?.cliVersion
        ? 'client.cliGui.update' : 'client.cliGui.install')}
    </button>}
    <a href={url} target="_blank" rel="noopener noreferrer"
    aria-label={uiText('client.cliGui.officialInstall', { cli: engine === 'claude' ? 'Claude Code' : 'Gemini CLI' })}
    onClick={event => {
      if (!isTauri()) return;
      event.preventDefault();
      void openUrl(url).catch(() => { void message.error({
        content: uiText('client.conversation.couldNotOpenTheLinkPleaseTryAgainShortly'),
        style: { maxWidth: 400, marginInline: 'auto' },
      }); });
    }}>
    <ExternalLink size={12} aria-hidden="true" />
    {officialOnly && uiText('client.cliGui.officialInstall', { cli: engine === 'claude' ? 'Claude Code' : 'Gemini CLI' })}
  </a></span>;
}
