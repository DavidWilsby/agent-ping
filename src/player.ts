import { spawn, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DEBOUNCE_MS = 50;
const STAMP_FILE = path.join(os.tmpdir(), '.agent-ping-last-play');

function isDebouncedOut(): boolean {
  try {
    const last = parseInt(fs.readFileSync(STAMP_FILE, 'utf-8'), 10);
    return Date.now() - last < DEBOUNCE_MS;
  } catch {
    return false;
  }
}

function writeStamp(): void {
  try { fs.writeFileSync(STAMP_FILE, String(Date.now())); } catch { /* ignore */ }
}

export function play(soundPath: string): void {
  if (!fs.existsSync(soundPath)) return;
  if (isDebouncedOut()) return;
  writeStamp();

  if (process.platform === 'darwin') {
    spawnSync('afplay', [soundPath]);
    return;
  }

  if (process.platform === 'linux') {
    const proc = spawn('paplay', [soundPath], { detached: true, stdio: 'ignore' });
    proc.on('error', () => {
      spawn('aplay', [soundPath], { detached: true, stdio: 'ignore' }).unref();
    });
    proc.unref();
    return;
  }

  if (process.platform === 'win32') {
    spawn(
      'powershell',
      ['-c', `(New-Object Media.SoundPlayer '${soundPath}').PlaySync()`],
      { detached: true, stdio: 'ignore' }
    ).unref();
    return;
  }
}
