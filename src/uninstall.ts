import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { HOOK_EVENT_COMMANDS, HookGroup } from './hooks';

/**
 * Removes agent-ping hooks from ~/.claude/settings.json
 * and deletes the ~/.agent-ping config directory.
 */
export function removeHooksAndConfig(): void {
  removeClaudeHooks();
  removeConfigDir();
  console.log('agent-ping uninstalled. You can now run: npm uninstall -g agent-ping-vscode');
}

function removeClaudeHooks(): void {
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');

  let settings: Record<string, unknown>;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as Record<string, unknown>;
  } catch {
    return; // No settings file — nothing to clean up
  }

  const hooks = settings['hooks'] as Record<string, HookGroup[]> | undefined;
  if (!hooks) return;

  let changed = false;

  for (const event of Object.keys(HOOK_EVENT_COMMANDS)) {
    const groups = hooks[event];
    if (!groups) continue;

    const filtered = groups.filter(
      group => !group.hooks?.some(h => h.command?.includes('agent-ping'))
    );

    if (filtered.length !== groups.length) {
      changed = true;
      if (filtered.length === 0) {
        delete hooks[event];
      } else {
        hooks[event] = filtered;
      }
    }
  }

  if (changed) {
    settings['hooks'] = hooks;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    console.log('Removed hooks from ~/.claude/settings.json');
  }
}

function removeConfigDir(): void {
  const configDir = path.join(os.homedir(), '.agent-ping');
  try {
    fs.rmSync(configDir, { recursive: true });
    console.log('Removed ~/.agent-ping/');
  } catch {
    // Directory doesn't exist — nothing to do
  }
}
