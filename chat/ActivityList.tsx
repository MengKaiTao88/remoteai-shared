import { useLayoutEffect, type ReactNode } from 'react';
import { uiText } from '../localization/uiText';
import { useScrollChain } from './useScrollChain';
import './activityList.less';

const VISIBLE_ACTIVITY_COUNT = 5;

function activityRow(summary: HTMLElement, list: HTMLElement) {
  let row = summary;
  while (row.parentElement && row.parentElement !== list) row = row.parentElement;
  return row;
}

/** Limit collapsed summaries to five rows and reserve room for the largest opened detail. */
export function ActivityList({ children, className, rowSelector }: {
  children: ReactNode; className: string; rowSelector: string;
}) {
  const list = useScrollChain<HTMLDivElement>();
  useLayoutEffect(() => {
    const node = list.current;
    if (!node) return;
    const summaries = Array.from(node.querySelectorAll<HTMLElement>(rowSelector));
    const rows = summaries.map(summary => activityRow(summary, node));
    const measure = () => {
      const style = getComputedStyle(node);
      const spacing = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'] as const;
      const padding = spacing.reduce((sum, property) => sum + (parseFloat(style[property]) || 0), 0);
      const gap = parseFloat(style.rowGap) || 0;
      const visible = summaries.slice(0, VISIBLE_ACTIVITY_COUNT);
      const height = visible.reduce((sum, summary) => sum + summary.getBoundingClientRect().height, 0);
      const detail = summaries.reduce((largest, summary, index) => Math.max(largest,
        rows[index].getBoundingClientRect().height - summary.getBoundingClientRect().height), 0);
      if (height > 0) node.style.maxHeight = `${height + gap * (visible.length - 1) + padding + detail}px`;
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    summaries.forEach(summary => observer.observe(summary));
    rows.forEach(row => observer.observe(row));
    return () => observer.disconnect();
  }, [children, rowSelector]);
  return <div ref={list} className={`${className} cs-activity-list`} data-activity-list tabIndex={0}
    role="region" aria-label={uiText('client.chat.activity')}>
    {children}
  </div>;
}
