import { forwardRef, useEffect, useMemo, useState, type ComponentProps, type Key } from 'react';
import { Empty, Table, theme } from 'antd';
import type { TableColumnsType } from 'antd';
import { ChevronDown, ChevronRight, Clock3, Folder } from 'lucide-react';
import { uiText } from '../../localization/uiText';
import { useGuiLanguage } from '../../localization/useGuiLanguage';
import { groupSyncThreads, SYNC_RECENT_KEY, syncThreadKey, type SyncRow } from './threadGroups';
import type { SyncThread } from './types';
import { useSyncTableSize } from './useSyncTableSize';
import styles from './sync.module.less';

const UPDATED_COLUMN_EM = 15;

interface Props {
  threads: SyncThread[]; selected: string[]; onSelect: (ids: string[]) => void;
  loading: boolean; locked: boolean; query: string;
}

function toggleLabel(open: boolean, cwd: string) {
  const key = cwd ? (open ? 'client.chat.collapseProject' : 'client.chat.expandProject')
    : (open ? 'client.chat.collapse' : 'client.chat.expand');
  return `${uiText(key)}: ${cwd || uiText('client.chat.recent')}`;
}

function SyncTableCell(props: ComponentProps<'div'>) {
  return <div {...props} role="cell" />;
}

const SyncTableRow = forwardRef<HTMLDivElement, ComponentProps<'div'>>((props, ref) =>
  <div {...props} ref={ref} role="row" />);

export function SyncThreadTable({ threads, selected, onSelect, loading, locked, query }: Props) {
  const language = useGuiLanguage();
  const { token } = theme.useToken();
  const { container, size } = useSyncTableSize();
  const projects = useMemo(() => groupSyncThreads(threads), [threads]);
  const [expanded, setExpanded] = useState<readonly Key[]>([SYNC_RECENT_KEY]);
  const projectKeys = JSON.stringify(projects.map(project => project.key));
  useEffect(() => {
    if (query.trim()) setExpanded(JSON.parse(projectKeys) as string[]);
  }, [query, projectKeys]);
  const columns: TableColumnsType<SyncRow> = [
    { title: uiText('client.conversationSync.titleColumn'), key: 'title', className: styles.titleColumn,
      render: (_, row) =>
      <div className={styles.titleCell}>
        {row.type === 'project' && (row.cwd
          ? <Folder size={18} color={token.colorTextSecondary} aria-hidden="true" />
          : <Clock3 size={18} color={token.colorTextSecondary} aria-hidden="true" />)}
        <div className={styles.thread}>
          <strong>{row.title || uiText(row.type === 'project'
            ? 'client.chat.recent' : 'client.conversationSync.untitled')}</strong>
          {row.type === 'project' && row.cwd && <span style={{ color: token.colorTextSecondary }}>{row.cwd}</span>}
          {row.type === 'thread' && row.matchExcerpt && <span>{row.matchExcerpt}</span>}
        </div>
      </div> },
    { title: uiText('client.conversationSync.kind.conversation'), key: 'count', width: 80, align: 'right',
      render: (_, row) => row.type === 'project' ? row.children.length : null },
    { title: uiText('client.conversationSync.updated'), key: 'updated', width: token.fontSize * UPDATED_COLUMN_EM,
      responsive: ['md'], render: (_, row) => row.updatedAt
        ? new Date(row.updatedAt * 1000).toLocaleString(language) : '—' },
  ];
  const changeSelection = (rows: SyncRow[]) => {
    const visible = new Set(threads.map(thread => thread.sessionId));
    onSelect([...new Set([...selected.filter(id => !visible.has(id)),
      ...rows.flatMap(row => row.type === 'thread' ? [row.sessionId] : [])])]);
  };
  return <div ref={container} className={styles.table}>
    <Table<SyncRow> size="small" rowKey="key" columns={columns} virtual
    components={{ body: { cell: SyncTableCell, row: SyncTableRow } }}
    dataSource={projects} loading={loading} pagination={false}
    scroll={{ x: size.width, y: size.height }} tableLayout="fixed"
    onRow={row => row.type === 'project' ? { style: { background: token.colorFillAlter } } : {}}
    rowSelection={{ columnWidth: token.controlHeight + token.paddingXS,
      selectedRowKeys: selected.map(syncThreadKey), checkStrictly: false, preserveSelectedRowKeys: true,
      onChange: (_, rows) => changeSelection(rows), getCheckboxProps: () => ({ disabled: locked }) }}
    expandable={{ expandedRowKeys: expanded,
      onExpandedRowsChange: setExpanded, indentSize: 24,
      expandIcon: ({ expanded: open, expandable, record, onExpand }) => expandable
        ? <button type="button" className={styles.expand} aria-expanded={open}
          aria-label={toggleLabel(open, record.cwd)}
          onClick={event => onExpand(record, event)}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button> : <span className={styles.expandSpace} /> }}
    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={uiText('client.conversationSync.empty')} /> }} />
  </div>;
}
