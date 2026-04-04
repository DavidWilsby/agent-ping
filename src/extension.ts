import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Config, BUNDLED_DEFAULTS, AlertMode } from './config';
import { play } from './player';
import {
  resolveGlobalBinDir,
  buildHookCommand,
  applyHookEntry,
  HOOK_EVENT_COMMANDS,
  HookGroup,
} from './hooks';

/**
 * Registers Claude Code hooks in ~/.claude/settings.json so that Agent Ping
 * is notified when Claude finishes, asks a question, or encounters an error.
 * This is the core integration mechanism — the hooks call the agent-ping-vscode
 * CLI binary which plays sounds and/or shows OS notifications.
 *
 * Socket.dev flags this file modification as medium risk. This is expected
 * behavior for a Claude Code hook integration.
 */
function installClaudeHooks(binDir: string): void {
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');

  let settings: Record<string, unknown> = {};
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as Record<string, unknown>;
  } catch {
    // File missing or invalid — start fresh
  }

  const hooks = (settings['hooks'] as Record<string, unknown[]> | undefined) ?? {};
  let changed = false;

  for (const [event, cmdArg] of Object.entries(HOOK_EVENT_COMMANDS)) {
    const existing = (hooks[event] as HookGroup[]) ?? [];
    const command = buildHookCommand(cmdArg, binDir);
    const result = applyHookEntry(existing, command);
    if (result.changed) {
      hooks[event] = result.groups;
      changed = true;
    }
  }

  if (changed) {
    settings['hooks'] = hooks;
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  }
}

async function ensureGlobalInstall(): Promise<string | null> {
  let binDir = resolveGlobalBinDir();
  if (binDir) return binDir;

  while (true) {
    const choice = await vscode.window.showWarningMessage(
      'Agent Ping requires a global install. Run: npm i -g agent-ping-vscode',
      'Retry',
    );
    if (choice !== 'Retry') return null;
    binDir = resolveGlobalBinDir();
    if (binDir) return binDir;
  }
}

function readVSCodeConfig(): Partial<Config> {
  const cfg = vscode.workspace.getConfiguration('agentPing');
  return {
    enabled: cfg.get<boolean>('enabled'),
    volume: cfg.get<number>('volume'),
    notificationEnabled: cfg.get<boolean>('notificationEnabled'),
    notificationSound: cfg.get<string>('notificationSound') ?? '',
    idlePromptEnabled: cfg.get<boolean>('idlePromptEnabled'),
    stopEnabled: cfg.get<boolean>('stopEnabled'),
    stopSound: cfg.get<string>('stopSound') ?? '',
    respectDnd: cfg.get<boolean>('respectDnd'),
    alertMode: cfg.get<string>('alertMode') as AlertMode,
  };
}

function writeConfigFile(config: Partial<Config>): void {
  const dir = path.join(os.homedir(), '.agent-ping-vscode');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(config, null, 2), 'utf-8');
}

function registerChooseCommand(
  context: vscode.ExtensionContext,
  commandId: string,
  settingKey: keyof Config
): void {
  const disposable = vscode.commands.registerCommand(commandId, async () => {
    const result = await vscode.window.showOpenDialog({
      canSelectMany: false,
      filters: { 'Sound files': ['wav', 'mp3', 'aiff', 'aif'] },
      title: 'Choose Sound File',
    });
    if (!result || result.length === 0) return;
    const cfg = vscode.workspace.getConfiguration('agentPing');
    try {
      await cfg.update(settingKey, result[0].fsPath, vscode.ConfigurationTarget.Global);
    } catch {
      vscode.window.showErrorMessage('Agent Ping: Could not save setting.');
    }
  });
  context.subscriptions.push(disposable);
}

function registerTestCommand(
  context: vscode.ExtensionContext,
  commandId: string,
  settingKey: keyof Config
): void {
  const disposable = vscode.commands.registerCommand(commandId, () => {
    const cfg = vscode.workspace.getConfiguration('agentPing');
    const rawValue = cfg.get<string>(settingKey);
    const resolvedPath = (rawValue && rawValue.length > 0)
      ? rawValue
      : String(BUNDLED_DEFAULTS[settingKey]);
    if (!fs.existsSync(resolvedPath)) {
      vscode.window.showErrorMessage('Agent Ping: Could not play sound. Check that the file path is correct.');
      return;
    }
    try {
      const volume = cfg.get<number>('volume') ?? 50;
      play(resolvedPath, volume);
    } catch {
      vscode.window.showErrorMessage('Agent Ping: Could not play sound.');
    }
  });
  context.subscriptions.push(disposable);
}

function registerResetCommand(
  context: vscode.ExtensionContext,
  commandId: string,
  settingKey: keyof Config
): void {
  const disposable = vscode.commands.registerCommand(commandId, async () => {
    const cfg = vscode.workspace.getConfiguration('agentPing');
    try {
      await cfg.update(settingKey, '', vscode.ConfigurationTarget.Global);
    } catch {
      vscode.window.showErrorMessage('Agent Ping: Could not reset setting.');
    }
  });
  context.subscriptions.push(disposable);
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const binDir = await ensureGlobalInstall();
  if (binDir) {
    installClaudeHooks(binDir);
  }
  writeConfigFile(readVSCodeConfig());

  const disposable = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('agentPing')) {
      writeConfigFile(readVSCodeConfig());
    }
  });

  context.subscriptions.push(disposable);

  registerChooseCommand(context, 'agentPing.chooseStopSound', 'stopSound');
  registerChooseCommand(context, 'agentPing.chooseNotificationSound', 'notificationSound');

  registerTestCommand(context, 'agentPing.testStopSound', 'stopSound');
  registerTestCommand(context, 'agentPing.testNotificationSound', 'notificationSound');

  registerResetCommand(context, 'agentPing.resetStopSound', 'stopSound');
  registerResetCommand(context, 'agentPing.resetNotificationSound', 'notificationSound');

  context.subscriptions.push(
    vscode.commands.registerCommand('agentPing.resetVolume', async () => {
      const cfg = vscode.workspace.getConfiguration('agentPing');
      try {
        await cfg.update('volume', undefined, vscode.ConfigurationTarget.Global);
      } catch {
        vscode.window.showErrorMessage('Agent Ping: Could not reset setting.');
      }
    })
  );

  // --- Deprecation notice ---
  const DEPRECATION_KEY = 'agentPing.deprecationDismissed';
  const DEPRECATION_LAST_SHOWN_KEY = 'agentPing.deprecationLastShown';
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const dismissed = context.globalState.get<boolean>(DEPRECATION_KEY, false);
  if (!dismissed) {
    const lastShown = context.globalState.get<number>(DEPRECATION_LAST_SHOWN_KEY, 0);
    const now = Date.now();
    if (now - lastShown > ONE_WEEK_MS) {
      context.globalState.update(DEPRECATION_LAST_SHOWN_KEY, now);
      const choice = await vscode.window.showInformationMessage(
        'This extension is deprecated. Agent Ping is now a Claude Code plugin — install with one command instead for cross-platform support.',
        'Learn more',
        "Don't show again"
      );
      if (choice === 'Learn more') {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/DavidWilsby/agent-ping'));
      } else if (choice === "Don't show again") {
        context.globalState.update(DEPRECATION_KEY, true);
      }
    }
  }
}

export function deactivate(): void {
  // nothing to clean up
}
