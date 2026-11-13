import type { GuiAccountsClient } from '../guiAccounts';
import { guiAccountAvatar } from '../guiAccountAvatar';
import { useCliGui } from '../../cli-gui/context';
import { useGuiAccounts } from '../client/useGuiAccounts';
import { t, useLanguage } from '../../localization/browserClient';
import './chat-list-button.css';

interface Props {
  client: GuiAccountsClient; active: boolean; ready: boolean; expanded: boolean; onClick: () => void;
}

export function ChatListButton({ client, active, ready, expanded, onClick }: Props) {
  useLanguage();
  const cli = useCliGui();
  const { snapshot } = useGuiAccounts(client, active && ready);
  const avatar = guiAccountAvatar(snapshot, t("client.chat.me"), cli?.state.engine);
  return <button type="button" className="chat-list-button"
    aria-label={expanded ? t("client.chat.collapseChatList") : t("client.chat.openChatList")} aria-expanded={expanded} onClick={onClick}>
    <span className="chat-list-avatar" aria-hidden="true">{avatar.initials}</span>
  </button>;
}
