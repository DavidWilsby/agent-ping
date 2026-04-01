import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Config {
  enabled: boolean;
  notificationEnabled: boolean;
  notificationSound: string;
  idlePromptEnabled: boolean;
  stopEnabled: boolean;
  stopSound: string;
  volume: number;
}

const SOUNDS_DIR = path.join(__dirname, '..', 'sounds');

export const BUNDLED_DEFAULTS: Config = {
  enabled: true,
  notificationEnabled: true,
  notificationSound: path.join(SOUNDS_DIR, 'Ping.aiff'),
  idlePromptEnabled: false,
  stopEnabled: true,
  stopSound: path.join(SOUNDS_DIR, 'Done.aiff'),
  volume: 50,
};

function readConfigFile(): Partial<Config> {
  const configPath = path.join(os.homedir(), '.agent-ping-vscode', 'config.json');
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as Partial<Config>;
  } catch {
    return {};
  }
}

export function resolveConfig(): Config {
  const fileConfig = readConfigFile();
  const base: Config = { ...BUNDLED_DEFAULTS, ...fileConfig };

  // Empty string sound paths mean "use bundled default"
  const soundKeys: (keyof Config)[] = ['notificationSound', 'stopSound'];
  for (const key of soundKeys) {
    if (base[key] === '') (base as Record<keyof Config, unknown>)[key] = BUNDLED_DEFAULTS[key];
  }

  const envStop = process.env.AGENT_PING_STOP_SOUND;
  const envNotify = process.env.AGENT_PING_NOTIFICATION_SOUND;

  if (envStop) base.stopSound = envStop;
  if (envNotify) base.notificationSound = envNotify;

  const envVolume = process.env.AGENT_PING_VOLUME;
  if (envVolume !== undefined) {
    const parsed = parseInt(envVolume, 10);
    if (!isNaN(parsed)) base.volume = parsed;
  }

  if (typeof base.volume !== 'number' || isNaN(base.volume)) {
    base.volume = BUNDLED_DEFAULTS.volume;
  }
  base.volume = Math.max(0, Math.min(100, Math.round(base.volume)));

  return base;
}
