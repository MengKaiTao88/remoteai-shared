import { useState, type CSSProperties } from 'react';
import { Button, Empty, Segmented, Table, Tooltip, theme } from 'antd';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { officialUsageLabels } from '@remoteai/i18n/copy/client/officialUsageLabels';
import type { Language } from '../localization/language';
import type { OfficialAccountTotal } from '../officialUsage';
import { chartPalette, formatTokens } from './chartUtils';
import { accountQuota, quotaPercent, usageMaximum } from './officialUsageChartData';
import './officialUsageChart.css';

type Metric = 'tokens' | 'costUsd';
const LOW_QUOTA_PERCENT = 20;
type Labels = ReturnType<typeof officialUsageLabels>;
interface ChartProps {
  accounts: OfficialAccountTotal[];
  language: Language;
  unit?: string;
  formatCost?: (value: number) => string;
  formatAvailable?: (account: OfficialAccountTotal) => string | null;
}
interface RowProps {
  account: OfficialAccountTotal;
  metric: Metric;
  maximum: number;
  labels: Labels;
  language: Language;
  colors: string[];
  formatCost: (value: number) => string;
  available: string | null;
}

export function OfficialUsageChart({ accounts, language, unit = 'USD',
  formatCost = (value) => `${value.toFixed(2)} ${unit}`, formatAvailable }: ChartProps) {
  const [metric, setMetric] = useState<Metric>('tokens');
  const { token } = theme.useToken();
  const labels = officialUsageLabels(language, unit);
  const palette = chartPalette(token.colorPrimary, false);
  const variables = {
    '--usage-text': token.colorText, '--usage-muted': token.colorTextSecondary,
    '--usage-border': token.colorBorderSecondary, '--usage-track': token.colorFillTertiary,
    '--usage-good': token.colorSuccess, '--usage-warning': token.colorWarning,
    '--usage-empty': token.colorError, fontSize: token.fontSize, fontFamily: token.fontFamily,
  } as CSSProperties;
  const maximum = usageMaximum(accounts, metric);
  return <div className="official-usage-chart" style={variables}>
    <div className="official-usage-toolbar">
      <Segmented value={metric} onChange={setMetric} options={[
        { label: labels.tokens, value: 'tokens' }, { label: labels.cost, value: 'costUsd' },
      ]} />
      <span className="official-usage-legend">{labels.devices} {palette.series.slice(0, 3).map((color) =>
        <i key={color} className="official-usage-dot" style={{ background: color }} aria-hidden />)}</span>
    </div>
    {!accounts.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={labels.empty} />
      : [...accounts].sort((left, right) => right[metric] - left[metric]).map((account) => {
        const quota = accountQuota(account);
        const available = account.remainingUsd == null ? null
          : `${Number(account.remainingUsd.toFixed(2))} / ${quota?.capacityUsd == null
            ? '—' : Number(quota.capacityUsd.toFixed(2))}${unit}`;
        return <AccountRow key={account.accountId} account={account} metric={metric} maximum={maximum}
          labels={labels} language={language} colors={palette.series} formatCost={formatCost}
          available={formatAvailable ? formatAvailable(account) : available} />;
      })}
  </div>;
}

function AccountRow(props: RowProps) {
  const { account, metric, labels, language, maximum, colors, formatCost, available } = props;
  const [expanded, setExpanded] = useState(false);
  const value = metric === 'tokens' ? formatTokens(account.tokens, language) : formatCost(account.costUsd);
  const other = metric === 'tokens' ? formatCost(account.costUsd) : formatTokens(account.tokens, language);
  return <article className="official-usage-account" aria-label={account.accountLabel}>
    <div className="official-usage-row">
      <div className="official-usage-identity">
        <strong>{account.accountLabel}</strong>
        <Button type="text" size="small" disabled={!account.devices.length} aria-expanded={expanded}
          aria-label={`${labels.devices} · ${account.accountLabel}`} onClick={() => setExpanded(!expanded)}
          icon={expanded ? <ChevronDown size="1em" /> : <ChevronRight size="1em" />}>
          {labels.devices} · {account.devices.length}
        </Button>
      </div>
      <div className="official-usage-consumption">
        <div className="official-usage-value"><span>{labels[metric === 'tokens' ? 'tokens' : 'cost']}</span>
          <strong>{value}</strong></div>
        <UsageBar {...props} />
        <div className="official-usage-scale"><span>0</span>
          <span>{metric === 'tokens' ? formatTokens(maximum, language) : formatCost(maximum)}</span></div>
        <div className="official-usage-other">{labels[metric === 'tokens' ? 'cost' : 'tokens']}: {other}</div>
      </div>
      <QuotaChart account={account} labels={labels} available={available} formatCost={formatCost} />
    </div>
    {expanded && <Table className="official-usage-devices" rowKey="deviceId" size="small"
      dataSource={account.devices} pagination={false} scroll={{ x: 560 }} columns={[
        { title: labels.devices, dataIndex: 'deviceName', render: (name: string, _, index) => <span>
          <i className="official-usage-dot" style={{ background: colors[index % colors.length] }} />{name}</span> },
        { title: labels.tokens, dataIndex: 'tokens', render: (tokens: number) => formatTokens(tokens, language) },
        { title: labels.cost, dataIndex: 'costUsd', render: formatCost },
        { title: labels.updated, dataIndex: 'updatedAt', render: (ts: number) =>
          new Date(ts * 1000).toLocaleString(language) },
      ]} />}
  </article>;
}

function UsageBar({ account, metric, maximum, labels, language, colors, formatCost }: RowProps) {
  const total = account.devices.reduce((sum, device) => sum + Math.max(0, device[metric]), 0);
  const label = metric === 'tokens' ? labels.tokens : labels.cost;
  const value = metric === 'tokens' ? formatTokens(account.tokens, language) : formatCost(account.costUsd);
  return <div className="official-usage-track" role="img" aria-label={`${account.accountLabel} · ${label}: ${value}`}>
    <div className="official-usage-bar" style={{ width: `${account[metric] / maximum * 100}%` }}>
      {total > 0 ? account.devices.map((device, index) => <Tooltip key={device.deviceId}
        trigger={['hover', 'focus', 'click']} styles={{ root: { maxWidth: 400 } }} title={<>
          <strong>{device.deviceName}</strong><br />{labels.tokens}: {formatTokens(device.tokens, language)}
          <br />{labels.cost}: {formatCost(device.costUsd)}</>}>
        <span tabIndex={device[metric] > 0 ? 0 : undefined} style={{
          flexGrow: Math.max(0, device[metric]) / total, background: colors[index % colors.length],
        }} />
      </Tooltip>) : <span style={{ flexGrow: 1, background: colors[0] }} />}
    </div>
  </div>;
}

function QuotaChart({ account, labels, available, formatCost }: Pick<RowProps,
  'account' | 'labels' | 'available' | 'formatCost'>) {
  const percent = quotaPercent(account);
  const color = percent === 0 ? 'empty'
    : percent != null && percent <= LOW_QUOTA_PERCENT ? 'warning' : 'good';
  const windows = (['primary', 'secondary'] as const).filter((key) => account[key]);
  return <div className="official-usage-quota">
    <div className="official-usage-value"><span>{labels.remaining}</span>
      <Tooltip title={labels.detail} styles={{ root: { maxWidth: 400 } }}>
        <strong>{available ?? labels.unavailable}</strong>
      </Tooltip></div>
    {percent == null ? <div className="official-usage-unknown">—</div>
      : <div className="official-usage-quota-meter">
        <div className="official-usage-track" role="meter" aria-label={labels.remaining}
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={available ?? undefined}>
          <span style={{ width: `${percent}%`, background: `var(--usage-${color})` }} />
        </div><span>{Number(percent.toFixed(1))}%</span>
      </div>}
    <div className="official-usage-other">{labels.capacity}: {windows.length ? windows.map((key) =>
      <span key={key}>{windows.length > 1 && `${labels[key]} `}{account[key]?.capacityUsd == null
        ? labels.unavailable : formatCost(account[key]!.capacityUsd!)} </span>) : labels.unavailable}</div>
  </div>;
}
