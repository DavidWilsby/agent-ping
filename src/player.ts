import { spawn } from 'child_process';
import * as fs from 'fs';

export function play(soundPath: string, volume: number): void {
  if (volume === 0) return;
  if (!fs.existsSync(soundPath)) return;

  if (process.platform === 'darwin') {
    const v = String(volume / 100);
    spawn('afplay', ['-v', v, soundPath], { detached: true, stdio: 'ignore' }).unref();
    return;
  }

  if (process.platform === 'linux') {
    const v = String(Math.round(volume / 100 * 65536));
    const proc = spawn('paplay', [`--volume=${v}`, soundPath], { detached: true, stdio: 'ignore' });
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
