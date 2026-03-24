import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Config {
  enabled: boolean;
  stopSound: string;
  notificationSound: string;
  permissionSound: string;
  stopQuestionDetection: boolean;
  notificationQuestionDetection: boolean;
  stopEnabled: boolean;
  notificationEnabled: boolean;
  permissionEnabled: boolean;
}

const SOUNDS_DIR = path.join(__dirname, '..', 'sounds');

export const BUNDLED_DEFAULTS: Config = {
  enabled: true,
  stopSound: path.join(SOUNDS_DIR, 'Done.aiff'),
  notificationSound: path.join(SOUNDS_DIR, 'Ping.aiff'),
  permissionSound: path.join(SOUNDS_DIR, 'Ping.aiff'),
  stopQuestionDetection: true,
  notificationQuestionDetection: true,
  stopEnabled: true,
  notificationEnabled: true,
  permissionEnabled: true,
};

function readConfigFile(): Partial<Config> {
  const configPath = path.join(os.homedir(), '.agent-ping', 'config.json');
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
  const soundKeys: (keyof Config)[] = ['stopSound', 'notificationSound', 'permissionSound'];
  for (const key of soundKeys) {
    if (base[key] === '') (base as Record<keyof Config, unknown>)[key] = BUNDLED_DEFAULTS[key];
  }

  const envSound = process.env.AGENT_PING_SOUND;
  const envStop = process.env.AGENT_PING_STOP_SOUND;
  const envNotify = process.env.AGENT_PING_NOTIFICATION_SOUND;

  if (envStop) base.stopSound = envStop;
  if (envNotify) {
    base.notificationSound = envNotify;
    base.permissionSound = envNotify;
  }
  if (envSound) {
    if (!envStop) base.stopSound = envSound;
    if (!envNotify) {
      base.notificationSound = envSound;
      base.permissionSound = envSound;
    }
  }

  return base;
}
