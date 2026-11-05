export interface ConversationScope { backend: 'gui' | 'official'; revision: number }
let scope: ConversationScope | undefined;
const SCOPED_COMMANDS = new Set([
  'codex_gui_connect', 'codex_gui_request', 'codex_gui_respond', 'codex_gui_switch_backend',
  'codex_gui_model_settings', 'codex_gui_set_model_settings', 'codex_gui_queue_read', 'codex_gui_queue_save',
]);

/** Hosts initialize this before creating a conversation controller. Legacy hosts remain compatible. */
export function setConversationScope(value: ConversationScope | undefined) { scope = value; }
export function scopedConversationArgs(command: string, args: Record<string, unknown>) {
  return scope && SCOPED_COMMANDS.has(command) ? { ...args, scope } : args;
}
