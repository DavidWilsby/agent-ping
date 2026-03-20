import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Config } from './config';

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
  writeConfigFile(readVSCodeConfig());

  const disposable = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('agentPing')) {
      writeConfigFile(readVSCodeConfig());
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void { /* no-op */ }
