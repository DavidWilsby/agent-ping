import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getConfigDir } from './config';

const LEGACY_CONFIG_DIR = path.join(os.homedir(), '.agent-ping-vscode');
const LEGACY_CONFIG_PATH = path.join(LEGACY_CONFIG_DIR, 'config.json');
const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');

function getMarkerPath(): string {
  return path.join(getConfigDir(), '.migrated');
}


function copyLegacyConfig(): void {
  try {
    if (!fs.existsSync(LEGACY_CONFIG_PATH)) return;
    const content = fs.readFileSync(LEGACY_CONFIG_PATH, 'utf-8');
    const targetDir = getConfigDir();
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'config.json'), content, 'utf-8');
  } catch {
    // Best-effort
  }
}

function removeLegacyHooks(): boolean {
  try {
    if (!fs.existsSync(CLAUDE_SETTINGS_PATH)) return false;
    const content = fs.readFileSync(CLAUDE_SETTINGS_PATH, 'utf-8');
    const settings = JSON.parse(content);
    if (!settings.hooks) return false;

    let removed = false;
    for (const event of Object.keys(settings.hooks)) {
      const groups = settings.hooks[event];
      if (!Array.isArray(groups)) continue;
      settings.hooks[event] = groups.filter((group: any) => {
        const hooks = group.hooks || [];
        return !hooks.some((h: any) =>
          typeof h.command === 'string' && h.command.includes('agent-ping-vscode')
        );
      });
      if (settings.hooks[event].length < groups.length) removed = true;
    }

    if (removed) {
      fs.writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
    }
    return removed;
  } catch {
    return false;
  }
}

export function migrateIfNeeded(): void {
  const markerPath = getMarkerPath();
  const firstRun = !fs.existsSync(markerPath);

  // Config copy only on first run
  if (firstRun) {
    copyLegacyConfig();

    try {
      const targetDir = getConfigDir();
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(markerPath, new Date().toISOString(), 'utf-8');
    } catch {
      // Best-effort
    }
  }

  // Check for legacy hooks on every launch — the extension may reinstall
  // them after we clean them. This is a fast check (<1ms) so the cost is
  // negligible. We can't use a flag here because the extension can
  // reinstall hooks at any time without our knowledge.
  const hooksRemoved = removeLegacyHooks();

  if (hooksRemoved) {
    console.log(`
Legacy Agent Ping hooks cleaned up. To avoid double pings, uninstall the old VS Code extension:
  - VS Code:   code --uninstall-extension dawi.agent-ping-vscode
  - Cursor:    cursor --uninstall-extension dawi.agent-ping-vscode
  - Windsurf:  windsurf --uninstall-extension dawi.agent-ping-vscode
`);
  }
}
