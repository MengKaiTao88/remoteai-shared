import type { OfficialAccountTotal } from '../officialUsage';

/** Match the limiting window selected by the server; both amounts must describe the same quota. */
export function accountQuota(account: OfficialAccountTotal) {
  if (account.remainingUsd == null) return undefined;
  return [account.primary, account.secondary].find((quota) => quota?.remainingUsd === account.remainingUsd);
}

export function quotaPercent(account: OfficialAccountTotal): number | null {
  const capacity = accountQuota(account)?.capacityUsd;
  if (account.remainingUsd == null || capacity == null || !Number.isFinite(capacity) || capacity <= 0) return null;
  return Math.max(0, Math.min(100, account.remainingUsd / capacity * 100));
}

export function usageMaximum(accounts: OfficialAccountTotal[], metric: 'tokens' | 'costUsd') {
  return Math.max(1, ...accounts.map((account) => account[metric]));
}
