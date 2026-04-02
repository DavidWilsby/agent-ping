import { select } from '@inquirer/prompts';
import { resolveConfig, BUNDLED_DEFAULTS, AlertMode, Config } from './config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_PATH = path.join(os.homedir(), '.agent-ping-vscode', 'config.json');

const CANCELLED = Symbol('cancelled');

/**
 * Wraps an @inquirer/prompts select call so that pressing Escape
 * cancels the prompt and returns the CANCELLED sentinel.
 */
async function cancellableSelect<T>(opts: Parameters<typeof select<T>>[0]): Promise<T | typeof CANCELLED> {
  const prompt = select<T>(opts) as Promise<T> & { cancel: () => void };

  const onKeypress = (_chunk: Buffer, key: { name: string }) => {
    if (key?.name === 'escape') prompt.cancel();
  };
  process.stdin.on('keypress', onKeypress);

  try {
    return await prompt;
  } catch {
    return CANCELLED;
  } finally {
    process.stdin.removeListener('keypress', onKeypress);
  }
}

function saveConfig(config: Partial<Config>): void {
  const dir = path.dirname(CONFIG_PATH);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

function onOff(value: boolean): string {
  return value ? 'on' : 'off';
}

function volumeBar(vol: number): string {
  const filled = Math.round(vol / 5);
  return '█'.repeat(filled) + '░'.repeat(20 - filled);
}

type SettingKey = 'enabled' | 'alertMode' | 'respectDnd' | 'volume' | 'notificationEnabled' | 'idlePromptEnabled' | 'stopEnabled';

export async function configure(): Promise<void> {
  const config = resolveConfig();

  let lastSetting: SettingKey | 'quit' | undefined;

  while (true) {
    console.clear();
    console.log('\n  Agent Ping Settings\n  ───────────────────\n');

    const setting = await cancellableSelect<SettingKey | 'quit'>({
      message: 'Choose a setting to change (Esc to save and exit)',
      loop: false,
      pageSize: 8,
      default: lastSetting,
      choices: [
        { name: `Enabled             ${onOff(config.enabled)}`, value: 'enabled' as const },
        { name: `Alert Mode          ${config.alertMode}`, value: 'alertMode' as const },
        { name: `Respect DND         ${onOff(config.respectDnd)}`, value: 'respectDnd' as const },
        { name: `Volume              ${volumeBar(config.volume)} ${config.volume}%`, value: 'volume' as const },
        { name: `Notification Sound  ${onOff(config.notificationEnabled)}`, value: 'notificationEnabled' as const },
        { name: `Idle Prompt Sound   ${onOff(config.idlePromptEnabled)}`, value: 'idlePromptEnabled' as const },
        { name: `Stop Sound          ${onOff(config.stopEnabled)}`, value: 'stopEnabled' as const },
        { name: `Save and exit`, value: 'quit' as const },
      ],
    });

    if (setting === CANCELLED || setting === 'quit') break;
    lastSetting = setting;

    if (setting === 'alertMode') {
      console.clear();
      const result = await cancellableSelect<AlertMode>({
        message: 'Alert mode (Esc to go back)',
        loop: false,
        choices: [
          { name: 'Sound only', value: 'sound' },
          { name: 'Notification banner only', value: 'notification' },
          { name: 'Sound and notification', value: 'both' },
        ],
        default: config.alertMode,
      });
      if (result !== CANCELLED) config.alertMode = result;
    } else if (setting === 'volume') {
      console.clear();
      const volumes: number[] = [];
      for (let v = 0; v <= 100; v += 5) volumes.push(v);
      const result = await cancellableSelect<number>({
        message: 'Volume (Esc to go back)',
        loop: false,
        choices: volumes.map(v => ({
          name: `${volumeBar(v)} ${String(v).padStart(3)}%`,
          value: v,
        })),
        default: config.volume,
      });
      if (result !== CANCELLED) config.volume = result;
    } else {
      console.clear();
      const result = await cancellableSelect<boolean>({
        message: `${setting} (Esc to go back)`,
        loop: false,
        choices: [
          { name: 'On', value: true },
          { name: 'Off', value: false },
        ],
        default: config[setting] as boolean,
      });
      if (result !== CANCELLED) config[setting] = result;
    }
  }

  saveConfig({
    enabled: config.enabled,
    alertMode: config.alertMode,
    respectDnd: config.respectDnd,
    volume: config.volume,
    notificationEnabled: config.notificationEnabled,
    notificationSound: config.notificationSound === BUNDLED_DEFAULTS.notificationSound ? '' : config.notificationSound,
    idlePromptEnabled: config.idlePromptEnabled,
    stopEnabled: config.stopEnabled,
    stopSound: config.stopSound === BUNDLED_DEFAULTS.stopSound ? '' : config.stopSound,
  });

  console.clear();
  console.log('\n  Settings saved to ~/.agent-ping-vscode/config.json\n');
}
