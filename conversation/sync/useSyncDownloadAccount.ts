import { useEffect } from 'react';
import { releaseSyncHosts } from './downloads';

/** Revoke background transfer connections as soon as their account leaves the application. */
export function useSyncDownloadAccount(owner: string) {
  useEffect(() => () => { if (owner) releaseSyncHosts(owner); }, [owner]);
}
