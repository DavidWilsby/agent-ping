export interface EventMessage {
  title: string;
  message: string;
}

const EVENT_MESSAGES: Record<string, EventMessage> = {
  stop: {
    title: 'Agent Ping',
    message: 'Claude has finished the task.',
  },
  idle_prompt: {
    title: 'Agent Ping',
    message: 'Claude is waiting for your input.',
  },
  elicitation_dialog: {
    title: 'Agent Ping',
    message: 'Claude has a question for you.',
  },
  PermissionRequest: {
    title: 'Agent Ping',
    message: 'Claude needs your permission to proceed.',
  },
  StopFailure: {
    title: 'Agent Ping',
    message: 'Claude encountered an error and needs attention.',
  },
};

const FALLBACK: EventMessage = {
  title: 'Agent Ping',
  message: 'Claude needs your attention.',
};

export function getEventMessage(eventType: string, subType?: string): EventMessage {
  return EVENT_MESSAGES[subType || eventType] ?? FALLBACK;
}
