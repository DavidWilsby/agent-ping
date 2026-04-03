"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEvent = handleEvent;
const player_1 = require("./player");
const dnd_1 = require("./dnd");
const notifier_1 = require("./notifier");
const messages_1 = require("./messages");
const ACTIONABLE_TYPES = new Set(['idle_prompt', 'elicitation_dialog']);
function resolveSound(config, event) {
    return event === 'stop' ? config.stopSound : config.notificationSound;
}
function isActionable(stdin) {
    let payload = {};
    try {
        payload = JSON.parse(stdin);
    }
    catch { /* ignore */ }
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
function dispatch(config, soundEvent, messageKey) {
    const mode = config.alertMode;
    const suppressSound = config.respectDnd && (0, dnd_1.isDndActive)();
    if ((mode === 'sound' || mode === 'both') && !suppressSound) {
        (0, player_1.play)(resolveSound(config, soundEvent), config.volume);
    }
    // Always send notifications — macOS filters per Focus mode settings
    if (mode === 'notification' || mode === 'both') {
        const msg = (0, messages_1.getEventMessage)(soundEvent, messageKey);
        (0, notifier_1.showNotification)(msg.title, msg.message);
    }
}
async function handleEvent(event, stdin, config) {
    if (!config.enabled)
        return;
    if (event === 'notification') {
        if (!config.notificationEnabled)
            return;
        const { actionable, type } = isActionable(stdin);
        if (!actionable)
            return;
        if (type === 'idle_prompt' && !config.idlePromptEnabled)
            return;
        dispatch(config, 'notification', type);
        return;
    }
    // stop
    if (!config.stopEnabled)
        return;
    dispatch(config, 'stop', 'stop');
}
