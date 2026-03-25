import { Config } from './config';
import { play } from './player';

export type EventType = 'stop' | 'notification';

const ACTIONABLE_TYPES = new Set(['permission_prompt', 'idle_prompt', 'elicitation_dialog']);

function resolveSound(config: Config, event: 'stop' | 'notification'): string {
  return event === 'stop' ? config.stopSound : config.notificationSound;
}

function isActionable(stdin: string): { actionable: boolean; type: string } {
  let payload: { notification_type?: string; hook_event_name?: string } = {};
  try { payload = JSON.parse(stdin); } catch { /* ignore */ }
  if (payload.hook_event_name === 'StopFailure') return { actionable: true, type: 'StopFailure' };
  const type = payload.notification_type ?? '';
  return { actionable: ACTIONABLE_TYPES.has(type), type };
}

export async function handleEvent(event: EventType, stdin: string, config: Config): Promise<void> {
  if (!config.enabled) return;

  if (event === 'notification') {
    if (!config.notificationEnabled) return;
    const { actionable, type } = isActionable(stdin);
    if (!actionable) return;
    if (type === 'idle_prompt' && !config.idlePromptEnabled) return;
    play(resolveSound(config, 'notification'), config.volume);
    return;
  }

  // stop
  if (!config.stopEnabled) return;
  play(resolveSound(config, 'stop'), config.volume);
}
