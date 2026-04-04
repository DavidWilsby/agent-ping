"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.showNotification = showNotification;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const ICON_PATH = path.join(__dirname, '..', 'icon.png');
const TERMINAL_NOTIFIER = path.join(__dirname, '..', 'vendor', 'terminal-notifier.app', 'Contents', 'MacOS', 'terminal-notifier');
function escapePowerShell(s) {
    return s.replace(/"/g, '`"').replace(/\$/g, '`$');
}
function showOsNotification(title, message) {
    if (process.platform === 'darwin') {
        (0, child_process_1.spawn)(TERMINAL_NOTIFIER, [
            '-title', title,
            '-message', message,
            '-sender', 'com.agentping.notifier',
        ], { detached: true, stdio: 'ignore' }).unref();
        return;
    }
    if (process.platform === 'linux') {
        const proc = (0, child_process_1.spawn)('notify-send', ['-i', ICON_PATH, title, message], {
            detached: true,
            stdio: 'ignore',
        });
        proc.on('error', () => { });
        proc.unref();
        return;
    }
    if (process.platform === 'win32') {
        const script = [
            '[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null',
            '$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)',
            '$textNodes = $template.GetElementsByTagName("text")',
            `$textNodes.Item(0).AppendChild($template.CreateTextNode("${escapePowerShell(title)}")) | Out-Null`,
            `$textNodes.Item(1).AppendChild($template.CreateTextNode("${escapePowerShell(message)}")) | Out-Null`,
            '$toast = [Windows.UI.Notifications.ToastNotification]::new($template)',
            '[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Agent Ping").Show($toast)',
        ].join('; ');
        (0, child_process_1.spawn)('powershell', ['-NoProfile', '-c', script], {
            detached: true,
            stdio: 'ignore',
        }).unref();
        return;
    }
}
function showNotification(title, message) {
    try {
        showOsNotification(title, message);
    }
    catch {
        // Never throw — notification is best-effort
    }
}
