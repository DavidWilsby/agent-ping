import { execSync } from 'child_process';

/**
 * Returns true if macOS Do Not Disturb / Focus mode is currently active.
 * Always returns false on non-macOS platforms.
 */
export function isDndActive(): boolean {
  if (process.platform !== 'darwin') return false;

  try {
    const result = execSync(
      'defaults -currentHost read com.apple.controlcenter "NSStatusItem Visible FocusModes"',
      { encoding: 'utf-8', timeout: 2000, stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    return result === '1';
  } catch {
    return false;
  }
}
