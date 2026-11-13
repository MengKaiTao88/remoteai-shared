import { theme } from 'antd';
import { Fragment } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { displayText as t } from '../localization/messages';
import { clientVersionItems } from './clientVersion';
import type { LoungeAccount } from './types';
import './clientVersion.css';

interface Props { user: LoungeAccount; profile?: boolean; online?: boolean }

export function LoungeClientVersion({ user, profile = false, online = false }: Props) {
  const { token } = theme.useToken();
  const clients = clientVersionItems(user);
  if (!clients.length) return null;
  return <span className={`lounge-client-version${profile ? ' is-profile' : ''}`}
    role={online ? 'group' : undefined} aria-label={online ? t('client.lounge.userOnline') : undefined}
    style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
    {profile && <span>{t('client.settings.version')} </span>}
    <span className="lounge-client-version-list">{clients.map((client, index) => {
      const Icon = client.platform === 'desktop' ? Monitor : client.platform === 'mobile' ? Smartphone : undefined;
      return <Fragment key={`${client.platform ?? ''}:${client.version}`}>
        {index > 0 && <span className="lounge-client-version-separator"> · </span>}
        <span className={`lounge-client-version-item${online && Icon ? ' is-online' : ''}`}
          data-client-platform={client.platform}>
          {Icon && <Icon size="1.25em" strokeWidth={1.8} aria-hidden />}
          <span>v{client.version}</span>
        </span>
      </Fragment>;
    })}</span>
  </span>;
}
