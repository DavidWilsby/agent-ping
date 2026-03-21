import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Config } from './config';

const AGENT_PING_HOOKS: Record<string, string> = {
  Stop: 'npx --yes agent-ping@latest stop',
  Notification: 'npx --yes agent-ping@latest notification',
  PermissionRequest: 'npx --yes agent-ping@latest permission',
};

function installClaudeHooks(): void {
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');

  let settings: Record<string, unknown> = {};
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as Record<string, unknown>;
  } catch {
    // File missing or invalid — start fresh
  }

  const hooks = (settings['hooks'] as Record<string, unknown[]> | undefined) ?? {};
  let changed = false;

  for (const [event, command] of Object.entries(AGENT_PING_HOOKS)) {
    const existing = (hooks[event] as Array<{ hooks: Array<{ command?: string }> }>) ?? [];
    const alreadyInstalled = existing.some(group =>
      group.hooks?.some(h => h.command?.includes('agent-ping'))
    );
    if (!alreadyInstalled) {
      hooks[event] = [...existing, { hooks: [{ type: 'command', command }] }];
      changed = true;
    }
  }

  if (changed) {
    settings['hooks'] = hooks;
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  }
}

function readVSCodeConfig(): Partial<Config> {
  const cfg = vscode.workspace.getConfiguration('agentPing');
  return {
    enabled: cfg.get<boolean>('enabled'),
    useSingleSound: cfg.get<boolean>('useSingleSound'),
    singleSound: cfg.get<string>('singleSound') ?? '',
    stopSound: cfg.get<string>('stopSound') ?? '',
    notificationSound: cfg.get<string>('notificationSound') ?? '',
    permissionSound: cfg.get<string>('permissionSound') ?? '',
    questionDetection: cfg.get<boolean>('questionDetection'),
    stopEnabled: cfg.get<boolean>('stopEnabled'),
    notificationEnabled: cfg.get<boolean>('notificationEnabled'),
    permissionEnabled: cfg.get<boolean>('permissionEnabled'),
  };
}

function writeConfigFile(config: Partial<Config>): void {
  const dir = path.join(os.homedir(), '.agent-ping');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(config, null, 2), 'utf-8');
}

export function activate(context: vscode.ExtensionContext): void {
  installClaudeHooks();
  writeConfigFile(readVSCodeConfig());

  const disposable = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('agentPing')) {
      writeConfigFile(readVSCodeConfig());
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void { /* no-op */ }
