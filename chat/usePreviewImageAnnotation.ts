import { useEffect, useRef, useState } from 'react';
import { useImageAnnotationTarget } from './ImageAnnotations';
import { prepareImageEdit } from '../remote-chat/views/prepareImageEdit';
import type { ConnectionMode } from '../remote-chat/protocol';

interface EditingImage { source: string; scope: string; mode?: ConnectionMode }

export function usePreviewImageAnnotation(load: () => Promise<string>) {
  const target = useImageAnnotationTarget();
  const [editing, setEditing] = useState<EditingImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const open = async () => {
    const receiver = target?.current;
    if (!receiver || pending.current) return;
    pending.current = true;
    setBusy(true);
    setFailed(false);
    try {
      const source = await prepareImageEdit(await load(), receiver.mode);
      if (mounted.current && target.current?.scope === receiver.scope) {
        setEditing({ source, scope: receiver.scope, mode: receiver.mode });
      }
    } catch { if (mounted.current) setFailed(true); }
    finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const save = (url: string) => {
    const receiver = target?.current;
    if (!receiver || receiver.scope !== editing?.scope) throw new Error('Annotation target unavailable');
    receiver.add(url);
    requestAnimationFrame(() => {
      if (target.current?.scope === receiver.scope) target.current.focus();
    });
  };
  return { available: !!target?.current, editing, busy, failed, open, save, cancel: () => setEditing(null) };
}
