import type { RemoteGit } from '../../remote-chat/useRemoteGit';
import { t } from '../../localization/browserClient';

export function GitHistoryRepository({ panel, connected }: { panel: RemoteGit; connected: boolean }) {
  const entries = panel.repository?.repositories ?? [];
  if (entries.length < 2) return null;
  return <label className="git-history-repository">
    <span>{t('client.git.gitRepository')}</span>
    <select aria-label={t('client.git.gitRepository')} value={panel.historyRepository}
      disabled={!connected || panel.busy} title={panel.historyRepository}
      onChange={event => { void panel.selectHistoryRepository(event.target.value); }}>
      {entries.map(entry => <option key={entry.root} value={entry.root} disabled={!entry.available}>
        {entry.path || entry.root.split(/[\\/]/).filter(Boolean).at(-1) || entry.root}
      </option>)}
    </select>
  </label>;
}
