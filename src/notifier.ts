import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const ICON_PATH = path.join(__dirname, '..', 'icon.png');
const CONFIG_DIR = path.join(os.homedir(), '.agent-ping-vscode');
export const LOCK_PATH = path.join(CONFIG_DIR, 'extension.lock');
export const EVENT_PATH = path.join(CONFIG_DIR, 'event.json');

function escapeOsascript(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapePowerShell(s: string): string {
  return s.replace(/"/g, '`"').replace(/\$/g, '`$');
}

/**
 * Returns true if the VS Code extension is running (lock file exists).
 * When true, notifications are delegated to the extension via event file.
 */
function isExtensionActive(): boolean {
  try {
    return fs.existsSync(LOCK_PATH);
  } catch {
    return false;
  }
}

/**
 * Write an event file for the extension to pick up.
 */
function writeEvent(title: string, message: string): void {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(EVENT_PATH, JSON.stringify({ title, message, timestamp: Date.now() }), 'utf-8');
  } catch {
    // Best-effort
  }
}

/**
 * Show an OS-native notification (fallback for CLI-only users).
 */
function showOsNotification(title: string, message: string): void {
  if (process.platform === 'darwin') {
    spawn('osascript', [
      '-e',
      `display notification "${escapeOsascript(message)}" with title "${escapeOsascript(title)}"`,
    ], { detached: true, stdio: 'ignore' }).unref();
    return;
  }

  if (process.platform === 'linux') {
    const proc = spawn('notify-send', ['-i', ICON_PATH, title, message], {
      detached: true,
      stdio: 'ignore',
    });
    proc.on('error', () => { /* notify-send not installed */ });
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
    spawn('powershell', ['-NoProfile', '-c', script], {
      detached: true,
      stdio: 'ignore',
    }).unref();
    return;
  }
}

export function showNotification(title: string, message: string): void {
  try {
    if (isExtensionActive()) {
      writeEvent(title, message);
    } else {
      showOsNotification(title, message);
    }
  } catch {
    // Never throw — notification is best-effort
  }
}
