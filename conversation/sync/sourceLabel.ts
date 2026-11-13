import { SYNC_HOME_ID, type SyncHome, type SyncSource } from './types';

const GUI_APP_DIRECTORY = 'dev.codex.switch';
export const GUI_HOME_NAME = 'CodexGUI';

export function isGuiSyncHome(home: SyncHome) {
  return home.id === SYNC_HOME_ID || home.path.split(/[\\/]/)
    .some(segment => segment.toLowerCase() === GUI_APP_DIRECTORY);
}

export function syncSourceLabel(computer: string, home: SyncHome) {
  const gui = isGuiSyncHome(home);
  return `${computer} · ${gui ? GUI_HOME_NAME : home.path}`;
}

export function orderSyncSources(sources: SyncSource[]) {
  return [...sources].sort((left, right) => Number(isGuiSyncHome(right.home)) - Number(isGuiSyncHome(left.home)));
}
