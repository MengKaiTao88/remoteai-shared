import { useLayoutEffect, useState } from 'react';
import './codexAppearance.css';

export function useCodexAppearance() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark');
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.codexAppearance = 'true';
    const observer = new MutationObserver(() => setDark(root.dataset.theme === 'dark'));
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return dark;
}
