import { useState } from 'react';
import type { LoungeAccount } from './types';
import type { LoungeController } from './controller';

export function useLoungeDeletion(controller: LoungeController) {
  const [user, setUser] = useState<LoungeAccount>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const select = (value?: LoungeAccount) => { setError(false); setUser(value); };
  const confirm = async () => {
    if (!user || busy) return;
    setBusy(true); setError(false);
    try { await controller.deleteContact(user.id); setUser(undefined); }
    catch { setError(true); }
    finally { setBusy(false); }
  };
  return { user, select, busy, error, confirm };
}
