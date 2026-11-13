import { theme } from 'antd';
import { useMemo, type ReactNode } from 'react';
import { useGitVirtualList } from './useGitVirtualList';

interface Props<T> {
  items: readonly T[];
  itemKey: (item: T) => string;
  children: (item: T) => ReactNode;
  className?: string;
  role?: 'tree';
  label?: string;
  empty?: ReactNode;
}

/** Mount only intersecting rows, measuring natural heights so font scaling and metadata still fit. */
export function GitVirtualList<T>({ items, itemKey, children, className = '', role, label, empty }: Props<T>) {
  const { token } = theme.useToken();
  const keys = useMemo(() => items.map(itemKey), [items, itemKey]);
  const list = useGitVirtualList(keys, token.fontSize);
  return <div ref={list.viewport} className={`git-files git-virtual-list ${className}`} role={role} aria-label={label}
    onScroll={event => list.scroll(event.currentTarget.scrollTop)}>
    {!items.length ? empty : <div style={{ height: list.total, position: 'relative' }}>
      <div ref={list.content} style={{ position: 'absolute', top: list.before, width: '100%' }}>
        {items.slice(list.start, list.end).map((item, index) => <div key={keys[list.start + index]}
          data-git-row-key={keys[list.start + index]} style={{ display: 'flow-root' }}>{children(item)}</div>)}
      </div>
    </div>}
  </div>;
}
