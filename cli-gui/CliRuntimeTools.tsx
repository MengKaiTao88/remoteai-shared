import { Button, Popover } from 'antd';
import { RefreshCw } from 'lucide-react';
import { uiText } from '../localization/uiText';
import { useCliGui } from './context';
import { CliInstaller } from './CliInstaller';
import { CliUpdateIcon } from '../conversation/CliUpdateIcon';

export function CliRuntimeTools({ refreshModels }: { refreshModels?: () => Promise<void> }) {
  const cli = useCliGui();
  if (!cli || cli.state.engine === 'codex') return null;
  const busy = cli.state.busy || cli.state.selected?.status === 'running';
  const refresh = async () => {
    try { await refreshModels?.(); await cli.controller.refresh(); await cli.controller.loadCatalog(); }
    catch (error) { cli.controller.report(error); }
  };
  return <>
    <Button type="text" className="gui-remote-secondary-tool" icon={<RefreshCw size={16} />} disabled={busy}
      aria-label={uiText('client.cliGui.refresh')} onClick={() => { void refresh(); }} />
    <Popover trigger="click" placement="bottomRight" styles={{ root: { maxWidth: 400 } }}
      content={<CliInstaller compact />}>
      <Button type="text" className="gui-remote-secondary-tool"
        icon={<CliUpdateIcon version={cli.state.runtime[cli.state.engine]?.cliVersion ?? null} release={null} />}
        aria-label={uiText('client.cliGui.update')} />
    </Popover>
  </>;
}
