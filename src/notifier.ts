import { spawn } from 'child_process';
import * as path from 'path';

const ICON_PATH = path.join(__dirname, '..', 'icon.png');
const TERMINAL_NOTIFIER = path.join(__dirname, '..', 'vendor', 'terminal-notifier.app', 'Contents', 'MacOS', 'terminal-notifier');

function escapePowerShell(s: string): string {
  return s.replace(/"/g, '`"').replace(/\$/g, '`$');
}

function showOsNotification(title: string, message: string): void {
  if (process.platform === 'darwin') {
    spawn(TERMINAL_NOTIFIER, [
      '-title', title,
      '-message', message,
      '-appIcon', ICON_PATH,
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
    showOsNotification(title, message);
  } catch {
    // Never throw — notification is best-effort
  }
}
