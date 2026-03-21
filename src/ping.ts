import { Config } from './config';
import { play } from './player';
import { detectQuestion } from './detector';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export type EventType = 'stop' | 'notification' | 'permission';

function resolveSound(config: Config, event: 'stop' | 'notification' | 'permission'): string {
  if (event === 'stop') return config.stopSound;
  if (event === 'notification') return config.notificationSound;
  return config.permissionSound;
}

function findTranscript(sessionId: string): string | null {
  const base = path.join(os.homedir(), '.claude', 'projects');
  function search(dir: string): string | null {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          const result = search(path.join(dir, entry.name));
          if (result) return result;
        } else if (entry.name === `${sessionId}.jsonl`) {
          return path.join(dir, entry.name);
        }
      }
    } catch { /* ignore */ }
    return null;
  }
  return search(base);
}

export async function handleEvent(event: EventType, stdin: string, config: Config): Promise<void> {
  if (!config.enabled) return;

  if (event === 'notification') {
    if (!config.notificationEnabled) return;
    play(resolveSound(config, 'notification'));
    return;
  }

  if (event === 'permission') {
    if (!config.permissionEnabled) return;
    let payload: { permission_suggestions?: unknown[] } = {};
    try { payload = JSON.parse(stdin); } catch { /* ignore */ }
    if ((payload.permission_suggestions ?? []).length > 0) {
      play(resolveSound(config, 'permission'));
    }
    return;
  }

  // stop
  if (!config.stopEnabled) return;

  let payload: { session_id?: string; transcript_path?: string } = {};
  try { payload = JSON.parse(stdin); } catch { /* ignore */ }

  let transcriptPath: string | null = null;
  if (payload.transcript_path) {
    transcriptPath = payload.transcript_path;
  } else if (payload.session_id) {
    transcriptPath = findTranscript(payload.session_id);
  }

  if (config.questionDetection && transcriptPath && detectQuestion(transcriptPath)) {
    play(resolveSound(config, 'notification'));
    return;
  }

  play(resolveSound(config, 'stop'));
}
