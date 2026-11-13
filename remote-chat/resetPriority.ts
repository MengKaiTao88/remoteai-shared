export const RESET_PRIORITY_READ = 'resetPriorityRead';
export const RESET_PRIORITY_SET = 'resetPrioritySet';

export interface ResetPriorityStatus {
  running: boolean;
  autoSwitchOnQuotaExhaustion: boolean;
  autoSwitchPriorityByReset: boolean;
  accounts: { id: string; priority: number; enabled: boolean; secondaryResetsAt: number | null }[];
}

export interface ResetPriorityChange {
  setting: 'autoSwitch' | 'resetPriority';
  enabled: boolean;
}

export function createResetPriorityClient(request: <T>(body: object) => Promise<T>) {
  return {
    read: () => request<ResetPriorityStatus>({ operation: RESET_PRIORITY_READ }),
    set: (change: ResetPriorityChange) => request<ResetPriorityStatus>({ operation: RESET_PRIORITY_SET, ...change }),
  };
}

export type ResetPriorityClient = ReturnType<typeof createResetPriorityClient>;
