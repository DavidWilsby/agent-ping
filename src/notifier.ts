import { spawn } from 'child_process';
import * as path from 'path';

const ICON_PATH = path.join(__dirname, '..', 'icon.png');

function escapeOsascript(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapePowerShell(s: string): string {
  return s.replace(/"/g, '`"').replace(/\$/g, '`$');
}

export function showNotification(title: string, message: string): void {
  try {
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
  } catch {
    // Never throw — notification is best-effort
  }
}
