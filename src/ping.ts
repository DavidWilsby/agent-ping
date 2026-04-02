import { Config } from './config';
import { play } from './player';
import { isDndActive } from './dnd';
import { showNotification } from './notifier';
import { getEventMessage } from './messages';

export type EventType = 'stop' | 'notification';

const ACTIONABLE_TYPES = new Set(['idle_prompt', 'elicitation_dialog']);

function resolveSound(config: Config, event: 'stop' | 'notification'): string {
  return event === 'stop' ? config.stopSound : config.notificationSound;
}

function isActionable(stdin: string): { actionable: boolean; type: string } {
  let payload: { notification_type?: string; hook_event_name?: string } = {};
  try { payload = JSON.parse(stdin); } catch { /* ignore */ }

  // Hook-level events — always actionable (PermissionRequest, StopFailure)
  const hookEvent = payload.hook_event_name ?? '';
  if (hookEvent === 'PermissionRequest' || hookEvent === 'StopFailure') {
    return { actionable: true, type: hookEvent };
  }

  // Notification-level filtering — permission_prompt is excluded because the
  // PermissionRequest hook already handles it (faster, and avoids double pings).
  const type = payload.notification_type ?? '';
  return { actionable: ACTIONABLE_TYPES.has(type), type };
}

function dispatch(config: Config, soundEvent: 'stop' | 'notification', messageKey: string): void {
  const mode = config.osNotificationsEnabled ? config.alertMode : 'sound';

  if (mode === 'sound' || mode === 'both') {
    play(resolveSound(config, soundEvent), config.volume);
  }

  if (mode === 'notification' || mode === 'both') {
    const msg = getEventMessage(soundEvent, messageKey);
    showNotification(msg.title, msg.message);
  }
}

export async function handleEvent(event: EventType, stdin: string, config: Config): Promise<void> {
  if (!config.enabled) return;
  if (config.respectDnd && isDndActive()) return;

  if (event === 'notification') {
    if (!config.notificationEnabled) return;
    const { actionable, type } = isActionable(stdin);
    if (!actionable) return;
    if (type === 'idle_prompt' && !config.idlePromptEnabled) return;
    dispatch(config, 'notification', type);
    return;
  }

  // stop
  if (!config.stopEnabled) return;
  dispatch(config, 'stop', 'stop');
}
