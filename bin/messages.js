"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventMessage = getEventMessage;
const EVENT_MESSAGES = {
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
const FALLBACK = {
    title: 'Agent Ping',
    message: 'Claude needs your attention.',
};
function getEventMessage(eventType, subType) {
    return EVENT_MESSAGES[subType || eventType] ?? FALLBACK;
}
