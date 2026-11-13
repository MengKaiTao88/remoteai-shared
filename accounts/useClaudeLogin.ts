import { useCallback, useEffect, useRef, useState } from 'react';
import {
  claudeAccountError, type ClaudeAccountTransport, type ClaudeLoginMethod, type ClaudeLoginStatus,
} from './claudeAccounts';

export function useClaudeLogin({ transport, accountId, onSaved }: {
  transport: ClaudeAccountTransport; accountId?: string; onSaved: () => void;
}) {
  const [status, setStatus] = useState<ClaudeLoginStatus>();
  const [method, setMethod] = useState<ClaudeLoginMethod>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const currentId = useRef<string>();
  const saved = useRef(onSaved);
  saved.current = onSaved;
  const cancel = useCallback(() => {
    generation.current++;
    const loginId = currentId.current;
    currentId.current = undefined;
    // A completed/expired attempt may already be gone. Cleanup must not replace the visible result.
    if (loginId) void transport.request({ action: 'cancel', loginId }).catch(() => undefined);
  }, [transport]);
  useEffect(() => cancel, [cancel]);

  useEffect(() => {
    if (!status?.loginId || ['complete', 'failed', 'cancelled'].includes(status.status)) return;
    const loginId = status.loginId;
    const expected = generation.current;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const poll = async () => {
      try {
        const result = await transport.request<ClaudeLoginStatus>({ action: 'poll', loginId });
        if (stopped || generation.current !== expected) return;
        setStatus(result);
        if (result.status === 'complete') { currentId.current = undefined; saved.current(); return; }
        if (result.status === 'failed' || result.status === 'cancelled') {
          setError(claudeAccountError(result.error)); return;
        }
        timer = setTimeout(() => void poll(), 1000);
      } catch (error) {
        if (!stopped && generation.current === expected) {
          setError(claudeAccountError(error));
          timer = setTimeout(() => void poll(), 1500);
        }
      }
    };
    timer = setTimeout(() => void poll(), 300);
    return () => { stopped = true; clearTimeout(timer); };
  }, [status?.loginId, transport]);

  const start = async (method: ClaudeLoginMethod) => {
    cancel();
    const expected = generation.current;
    setBusy(true); setError(''); setMethod(method);
    try {
      const result = await transport.request<ClaudeLoginStatus>({ action: 'start', method, accountId });
      if (generation.current !== expected) {
        void transport.request({ action: 'cancel', loginId: result.loginId }).catch(() => undefined); return;
      }
      currentId.current = result.loginId; setStatus(result);
    } catch (error) { if (generation.current === expected) setError(claudeAccountError(error)); }
    finally { if (generation.current === expected) setBusy(false); }
  };

  const submit = async (code: string) => {
    if (!status || busy) return;
    const expected = generation.current;
    setBusy(true); setError('');
    try { await transport.request({ action: 'submit', loginId: status.loginId, code }); }
    catch (error) { if (generation.current === expected) setError(claudeAccountError(error)); }
    finally { if (generation.current === expected) setBusy(false); }
  };
  const importCurrent = async () => {
    const expected = generation.current;
    setBusy(true); setError('');
    try { await transport.request({ action: 'import' }); if (generation.current === expected) saved.current(); }
    catch (error) { if (generation.current === expected) setError(claudeAccountError(error)); }
    finally { if (generation.current === expected) setBusy(false); }
  };
  const back = () => { cancel(); setStatus(undefined); setMethod(undefined); setError(''); setBusy(false); };
  return { status, method, busy, error, start, submit, importCurrent, back };
}
