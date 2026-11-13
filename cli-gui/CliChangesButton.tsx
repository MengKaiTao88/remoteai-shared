import { useMemo } from 'react';
import { ConversationChangesButton } from '../conversation/ConversationChangesButton';
import { useCliGui } from './context';
import { cliThread } from './presentation';

export function CliChangesButton() {
  const cli = useCliGui();
  const history = cli?.state.history ?? null;
  const thread = useMemo(() => cliThread(history), [history]);
  return <ConversationChangesButton value={thread?.turns ? { turns: thread.turns } : undefined} />;
}
