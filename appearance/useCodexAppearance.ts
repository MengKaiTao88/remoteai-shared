import { useLayoutEffect, useState } from 'react';

export function useCodexAppearance() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark');
  useLayoutEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setDark(root.dataset.theme === 'dark'));
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return dark;
}
