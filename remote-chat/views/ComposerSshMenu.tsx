import type { RefObject } from 'react';
import { Terminal } from 'lucide-react';
import { displayError, t, useLanguage } from '../../localization/browserClient';
import type { AttachmentReference } from '../../conversation/attachmentTypes';
import { sshCandidates, sshReference } from '../../conversation/sshReferences';
import { sshLabel } from '../../terminal/sshProfiles';
import { useSshCandidates, type ComposerSshProfiles } from '../../chat/useSshCandidates';
import { useComposerMenuKeyboard } from './useComposerMenuKeyboard';
import { useChatSurfaceTheme } from './useChatSurfaceTheme';

export function ComposerSshMenu(props: {
  input: RefObject<HTMLTextAreaElement>; query: string; ready: boolean; profiles?: ComposerSshProfiles;
  choose: (reference: AttachmentReference) => void; close: () => void;
}) {
  useLanguage();
  const surface = useChatSurfaceTheme();
  const { input, query, ready, profiles, choose, close } = props;
  const result = useSshCandidates({ active: true, connected: ready, profiles });
  const entries = sshCandidates(result.items, query);
  const keyboard = useComposerMenuKeyboard({ input, query, close, selectWithTab: true,
    options: entries.map(profile => ({ key: profile.id, enabled: ready,
      choose: () => choose(sshReference(profile)) })) });
  return <div className="chat-command-menu chat-conversation-menu" style={surface}
    aria-label={t('client.ssh.savedConnections')}>
    <header><strong>{t('client.ssh.savedConnections')}</strong></header>
    <div ref={keyboard.list} id={keyboard.id} className="chat-menu-options" role="menu"
      aria-label={t('client.ssh.savedConnections')}>
      {entries.map(profile => <button key={profile.id} type="button" role="menuitem" disabled={!ready}
        {...keyboard.optionProps(profile.id)} onMouseDown={event => event.preventDefault()}
        onClick={() => choose(sshReference(profile))}>
        <strong><Terminal size={14} aria-hidden="true" /> {sshReference(profile).name}</strong>
        <small>{sshLabel(profile)}</small>
      </button>)}
      {!ready && <p role="status">{t('client.chat.connectToSendAMessage')}</p>}
      {ready && result.loading && <p role="status">{t('client.mobile.loading')}</p>}
      {ready && result.error && <p role="status">{displayError(result.error)}</p>}
      {ready && !result.loading && !result.error && !entries.length
        && <p role="status">{t(query ? 'client.ssh.noMatchingConnections' : 'client.ssh.noSavedConnections')}</p>}
    </div>
  </div>;
}
