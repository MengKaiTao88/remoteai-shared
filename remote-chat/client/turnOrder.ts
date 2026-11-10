import type { Turn } from './types';

function creationTime(turn: Turn): number | undefined {
  if (typeof turn.startedAt === 'number' && Number.isFinite(turn.startedAt)) return turn.startedAt;
  // Codex turn IDs are UUIDv7; older history responses can omit startedAt.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(turn.id)) return;
  return Number.parseInt(turn.id.slice(0, 13).replace('-', ''), 16) / 1000;
}

/** Keep server order, inserting retained live turns at their chronological position. */
export function mergeTurnOrder(snapshot: Turn[], live: Turn[]): string[] {
  const positions = new Map(snapshot.map((turn, index) => [turn.id, index]));
  const times = snapshot.map(creationTime);
  const nextKnown = new Map<string, number>();
  let next: number | undefined;
  for (let index = live.length - 1; index >= 0; index--) {
    const position = positions.get(live[index].id);
    if (position !== undefined) next = position;
    else if (next !== undefined) nextKnown.set(live[index].id, next);
  }
  const slots = new Map<number, Turn[]>();
  const retained = new Set<string>();
  let previous: number | undefined;
  for (const turn of live) {
    const position = positions.get(turn.id);
    if (position !== undefined) { previous = position; continue; }
    if (retained.has(turn.id)) continue;
    retained.add(turn.id);
    const time = creationTime(turn);
    const later = time === undefined ? -1 : times.findIndex(value => value !== undefined && value > time);
    const afterKnown = time !== undefined && times.some(value => value !== undefined && value < time);
    const slot = later >= 0 ? later : afterKnown ? snapshot.length
      : nextKnown.get(turn.id) ?? (previous === undefined ? snapshot.length : previous + 1);
    const bucket = slots.get(slot) ?? [];
    bucket.push(turn);
    slots.set(slot, bucket);
  }
  const ids = (turns: Turn[]) => turns.sort((left, right) => {
    const a = creationTime(left), b = creationTime(right);
    return a !== undefined && b !== undefined ? a - b : 0;
  }).map(turn => turn.id);
  return [...snapshot.flatMap((turn, index) => [...ids(slots.get(index) ?? []), turn.id]),
    ...ids(slots.get(snapshot.length) ?? [])];
}
