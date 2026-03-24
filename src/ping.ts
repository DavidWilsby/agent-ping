import { Config } from './config';
import { play } from './player';

export type EventType = 'stop' | 'notification';

const ACTIONABLE_TYPES = new Set(['permission_prompt', 'idle_prompt', 'elicitation_dialog']);

function resolveSound(config: Config, event: 'stop' | 'notification'): string {
  return event === 'stop' ? config.stopSound : config.notificationSound;
}

const SKIP_TYPES = new Set(['permission_prompt']);

export async function handleEvent(event: EventType, stdin: string, config: Config): Promise<void> {
  if (!config.enabled) return;

  if (event === 'notification') {
    if (!config.notificationEnabled) return;
    play(resolveSound(config, 'notification'));
    return;
  }

  // stop
  if (!config.stopEnabled) return;
  play(resolveSound(config, 'stop'));
}

export function handleFilteredNotification(stdin: string, config: Config): void {
  if (!config.enabled || !config.notificationEnabled) return;
  let payload: { notification_type?: string } = {};
  try { payload = JSON.parse(stdin); } catch { /* ignore */ }
  if (SKIP_TYPES.has(payload.notification_type ?? '')) return;
  play(resolveSound(config, 'notification'));
}
