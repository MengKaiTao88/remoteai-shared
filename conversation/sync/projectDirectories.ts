const GUI_SCRATCH = /(?:^|\/)codex-gui-workspaces\/[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}\/*$/i;
const CODEX_SCRATCH = /(?:^|\/)Documents\/Codex\/\d{4}-\d{2}-\d{2}\/[^/]+(?:\/outputs)?\/*$/i;

export function syncDisplayPath(path: string) {
  return path.trim().replace(/^[/\\]{2}\?[/\\]UNC[/\\]/i, '\\\\').replace(/^[/\\]{2}\?[/\\]/, '');
}

export function syncProjectKey(path: string) {
  const display = syncDisplayPath(path).replaceAll('\\', '/');
  const normalized = display.replace(/\/+$/, '') || (display ? '/' : '');
  return /^[a-z]:/i.test(normalized) || normalized.startsWith('//') ? normalized.toLowerCase() : normalized;
}

export function syncProjectDirectory(cwd: string) {
  const path = syncDisplayPath(cwd);
  const normalized = path.replaceAll('\\', '/');
  return GUI_SCRATCH.test(normalized) || CODEX_SCRATCH.test(normalized) ? '' : path;
}
