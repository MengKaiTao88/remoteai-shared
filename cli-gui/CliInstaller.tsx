import { Button } from 'antd';
import { Download, Terminal } from 'lucide-react';
import { uiText } from '../localization/uiText';
import styles from '../conversation/styles.module.less';
import { useCliGui } from './context';
import { engineNames } from './EngineSelector';
import { CliInstallLink } from './CliInstallLink';
import { cliErrorText } from './errors';
import { InstallationProgress } from '../cli/InstallationProgress';

/** Use the same centered installation surface as the built-in GUI. */
export function CliInstaller({ compact = false }: { compact?: boolean }) {
  const cli = useCliGui();
  if (!cli || cli.state.engine === 'codex') return null;
  const { engine, runtime, busy } = cli.state;
  const status = runtime[engine];
  const installing = status?.status === 'installing';
  return <div className={`${compact ? styles.installCompact : styles.install} cli-gui-setup`}>
      {!compact && <div className={styles.welcomeIcon}><Terminal size={30} /></div>}
      <h2>{uiText(engineNames[engine])}{status?.cliVersion ? ` ${status.cliVersion}` : ''}</h2>
      <p>{uiText('client.cliGui.setupHint')}</p>
      <div className={styles.installActions}>
        <Button type="primary" icon={<Download size={16} />} loading={installing} disabled={busy}
          onClick={() => { void cli.controller.install(); }}>
          <span role={installing ? 'status' : undefined}>
            {uiText(installing ? 'client.cliGui.installing' : status?.cliVersion
              ? 'client.cliGui.update' : 'client.cliGui.install')}
          </span>
        </Button>
        <CliInstallLink engine={engine} officialOnly />
      </div>
      {installing && <InstallationProgress progress={status.progress} />}
      {status?.error && <p role="alert">{cliErrorText(status.error)}</p>}
  </div>;
}
