import type { Thread, Turn } from '../conversation/types';

/** A deterministic, network-free conversation rendered by the real local and remote message views. */
export function activityDisclosureThread(running = false): Thread {
  const turn: Turn = { id: 'disclosure', startedAt: Date.now() / 1000 - 76,
    status: running ? 'inProgress' : 'completed', durationMs: running ? undefined : 76_000, items: [
      { id: 'user', type: 'userMessage', text: '检查项目，完成后告诉我结果。' },
      { id: 'comment', type: 'agentMessage', phase: 'commentary', text: '我会先读取项目文件，再检查修改和测试结果。' },
      ...Array.from({ length: 15 }, (_, index) => ({ id: `command-${index}`, type: 'commandExecution',
        command: index === 0 ? 'Get-Content src/chat/Messages.tsx' : `npm test -- --run test-${index}`,
        status: running && index === 14 ? 'inProgress' : 'completed',
        aggregatedOutput: `PASS: test-${index}\n中文输出完整显示\n${'test passed\n'.repeat(12)}` })),
      { id: 'edit', type: 'fileChange', status: 'completed', changes: [
        { path: 'src/chat/Messages.tsx', kind: { type: 'update' }, diff: '@@ -1 +1 @@\n-old\n+new\n' },
      ] },
      { id: 'comment-2', type: 'agentMessage', phase: 'commentary', text: '项目文件和测试结果已核对。接下来检查窄屏布局，确保展开详情后仍然容易阅读。' },
      { id: 'check', type: 'commandExecution', status: 'completed', command: 'npm run build',
        aggregatedOutput: 'Build completed successfully.' },
      ...(!running ? [{ id: 'answer', type: 'agentMessage', phase: 'final_answer' as const,
        text: '检查完成。命令、文件修改和工具输出都可以逐级展开，正文保持清晰。' }] : []),
    ] };
  return { id: 'disclosure-chat', name: '同步测试', preview: '', cwd: 'C:/project', updatedAt: 1, turns: [turn] };
}
