import type { SyncThread } from './types';
import { syncDisplayPath, syncProjectDirectory, syncProjectKey } from './projectDirectories';

export interface SyncThreadRow extends SyncThread { key: string; type: 'thread' }
export interface SyncProjectRow {
  key: string; type: 'project'; title: string; cwd: string; updatedAt: number | null;
  children: SyncThreadRow[];
}
export type SyncRow = SyncProjectRow | SyncThreadRow;

export const syncThreadKey = (sessionId: string) => JSON.stringify(['thread', sessionId]);
export const SYNC_RECENT_KEY = JSON.stringify(['project', '']);

// Older hosts can list both the active and archived rollout of the same conversation.
// Titles are display text; only the session ID identifies a selectable conversation.
export function uniqueSyncThreads(threads: SyncThread[]): SyncThread[] {
  const unique = new Map<string, SyncThread>();
  for (const thread of threads) {
    const current = unique.get(thread.sessionId);
    const latest = !current || (thread.updatedAt ?? 0) > (current.updatedAt ?? 0) ? thread : current;
    unique.set(thread.sessionId, { ...latest,
      matchExcerpt: latest.matchExcerpt || current?.matchExcerpt || thread.matchExcerpt,
    });
  }
  return [...unique.values()];
}

export function groupSyncThreads(threads: SyncThread[]): SyncProjectRow[] {
  const projects = new Map<string, SyncProjectRow>();
  for (const thread of uniqueSyncThreads(threads)) {
    // Source metadata takes precedence, including explicitly projectless conversations.
    const cwd = thread.projectPath === undefined ? syncProjectDirectory(thread.cwd) : syncDisplayPath(thread.projectPath);
    const key = syncProjectKey(cwd);
    const name = cwd ? thread.projectName?.trim() : '';
    let project = projects.get(key);
    if (!project) {
      project = { key: JSON.stringify(['project', key]), type: 'project', cwd,
        title: name || cwd.split(/[\\/]/).filter(Boolean).at(-1) || cwd, updatedAt: null, children: [] };
      projects.set(key, project);
    }
    if (name) project.title = name;
    project.children.push({ ...thread, key: syncThreadKey(thread.sessionId), type: 'thread' });
    if ((thread.updatedAt ?? 0) > (project.updatedAt ?? 0)) project.updatedAt = thread.updatedAt;
  }
  return [...projects.values()].map(project => ({ ...project,
    children: project.children.sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0)),
  })).sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0));
}
