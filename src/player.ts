import { spawn, spawnSync } from 'child_process';
import * as fs from 'fs';

export function play(soundPath: string): void {
  if (!fs.existsSync(soundPath)) return;

  if (process.platform === 'darwin') {
    spawn('afplay', [soundPath], { detached: true, stdio: 'ignore' }).unref();
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
