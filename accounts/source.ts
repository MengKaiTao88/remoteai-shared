/** Missing source identifies accounts created before source-aware account management. */
export type OfficialAccountSource = 'codex' | 'claudeCode';

export interface AccountSource {
  accountSource?: string;
}

export function accountSource(account: AccountSource): string {
  return account.accountSource || 'codex';
}

export function accountSourceLabel(account: AccountSource): string {
  const source = accountSource(account);
  if (source === 'codex') return 'Codex';
  if (source === 'claudeCode') return 'Claude Code';
  return source;
}

export function isCodexAccount(account: AccountSource): boolean {
  return accountSource(account) === 'codex';
}
