import { Config } from './config';
import { play } from './player';

export type EventType = 'stop' | 'notification';

const ACTIONABLE_TYPES = new Set(['permission_prompt', 'idle_prompt', 'elicitation_dialog']);

function resolveSound(config: Config, event: 'stop' | 'notification'): string {
  return event === 'stop' ? config.stopSound : config.notificationSound;
}

export async function handleEvent(event: EventType, stdin: string, config: Config): Promise<void> {
  if (!config.enabled) return;

  if (event === 'notification') {
    if (!config.notificationEnabled) return;
    let payload: { notification_type?: string; hook_event_name?: string } = {};
    try { payload = JSON.parse(stdin); } catch { /* ignore */ }
    if (payload.hook_event_name === 'StopFailure' || ACTIONABLE_TYPES.has(payload.notification_type ?? '')) {
      play(resolveSound(config, 'notification'));
    }
    return;
  }

  // stop
  if (!config.stopEnabled) return;
  play(resolveSound(config, 'stop'));
}
