import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export type HookObject = { type?: string; command?: string };
export type HookGroup = { hooks?: HookObject[] };

export const HOOK_EVENT_COMMANDS: Record<string, string> = {
  Stop: 'stop',
  Notification: 'notification --filtered',
  StopFailure: 'notification',
  PermissionRequest: 'notification',
};

/**
 * Attempts to resolve the directory containing the globally installed
 * `agent-ping` binary using a two-step strategy:
 *  1. Shell detection via `which` (macOS/Linux) or `where` (Windows)
 *  2. npm prefix fallback — checks `$(npm config get prefix)/bin/` (macOS/Linux only)
 *
 * Returns the bin directory string if found, or null if not found.
 *
 * Note: nvm/asdf users typically fail Step 1 because those tools only add
 * binaries to PATH in interactive shell sessions. Step 2 handles them via
 * `npm config get prefix`, which reflects the active Node version's prefix.
 */
export function resolveGlobalBinDir(): string | null {
  const isWindows = process.platform === 'win32';

  // Step 1 — shell detection
  try {
    const cmd = isWindows ? 'where agent-ping' : 'which agent-ping';
    const opts = { encoding: 'utf-8' as const };
    const result = (execSync(cmd, opts) as string).trim();
    const firstLine = result.split('\n')[0].trim();
    if (firstLine) return path.dirname(firstLine);
  } catch { /* fall through */ }

  // Step 2 — npm prefix fallback (macOS/Linux only)
  if (!isWindows) {
    try {
      const opts = { encoding: 'utf-8' as const };
      const prefix = (execSync('npm config get prefix', opts) as string).trim();
      const binPath = path.join(prefix, 'bin', 'agent-ping');
      if (fs.existsSync(binPath)) return path.join(prefix, 'bin');
    } catch { /* fall through */ }
  }

  return null;
}

/**
 * Builds the hook command string for a given event command argument.
 *
 * macOS/Linux: `PATH="<binDir>:$PATH" agent-ping <cmdArg>`
 * Windows: `agent-ping <cmdArg>` (bare; PATH injection syntax differs)
 */
export function buildHookCommand(cmdArg: string, binDir: string | null): string {
  const isWindows = process.platform === 'win32';
  if (!isWindows && binDir) {
    return `PATH="${binDir}:$PATH" agent-ping ${cmdArg}`;
  }
  return `agent-ping ${cmdArg}`;
}

/**
 * Applies the three-branch merge logic for a single hook event's group array:
 *  1. New-style hook present (agent-ping, no npx) — no change
 *  2. Old-style hook present (agent-ping + npx) — replace the group in place
 *  3. Neither — append a new group
 *
 * Returns the updated groups array and whether a change was made.
 */
export function applyHookEntry(
  existing: HookGroup[],
  command: string
): { groups: HookGroup[]; changed: boolean } {
  const newStyleExists = existing.some(group =>
    group.hooks?.some(h => h.command?.includes('agent-ping') && !h.command?.includes('npx'))
  );
  if (newStyleExists) return { groups: existing, changed: false };

  const oldStyleIdx = existing.findIndex(group =>
    group.hooks?.some(h => h.command?.includes('agent-ping') && h.command?.includes('npx'))
  );

  const newGroup: HookGroup = { hooks: [{ type: 'command', command }] };

  if (oldStyleIdx !== -1) {
    const groups = [
      ...existing.slice(0, oldStyleIdx),
      newGroup,
      ...existing.slice(oldStyleIdx + 1),
    ];
    return { groups, changed: true };
  }

  return { groups: [...existing, newGroup], changed: true };
}
