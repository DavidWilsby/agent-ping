import { Config } from '../src/config';

jest.mock('../src/player', () => ({ play: jest.fn() }));
jest.mock('../src/dnd', () => ({ isDndActive: jest.fn().mockReturnValue(false) }));
jest.mock('../src/notifier', () => ({ showNotification: jest.fn() }));

const { play } = require('../src/player');
const { isDndActive } = require('../src/dnd');
const { showNotification } = require('../src/notifier');

const baseConfig: Config = {
  enabled: true,
  notificationSound: '/sounds/ping.wav',
  stopSound: '/sounds/done.wav',
  notificationEnabled: true,
  idlePromptEnabled: true,
  stopEnabled: true,
  volume: 50,
  respectDnd: true,
  alertMode: 'sound',
};

beforeEach(() => {
  (play as jest.Mock).mockClear();
  (isDndActive as jest.Mock).mockClear();
  (isDndActive as jest.Mock).mockReturnValue(false);
  (showNotification as jest.Mock).mockClear();
});

describe('handleEvent — enabled: false', () => {
  it('plays nothing when disabled', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('notification', '{}', { ...baseConfig, enabled: false });
    expect(play).not.toHaveBeenCalled();
  });
});

describe('handleEvent — DND (sound suppression)', () => {
  it('suppresses sound when Focus is active and respectDnd is true', async () => {
    (isDndActive as jest.Mock).mockReturnValue(true);
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '', { ...baseConfig, respectDnd: true });
    expect(play).not.toHaveBeenCalled();
  });

  it('still sends notification when Focus is active and respectDnd is true', async () => {
    (isDndActive as jest.Mock).mockReturnValue(true);
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '', { ...baseConfig, respectDnd: true, alertMode: 'both' });
    expect(play).not.toHaveBeenCalled();
    expect(showNotification).toHaveBeenCalled();
  });

  it('plays sound when Focus is active but respectDnd is false', async () => {
    (isDndActive as jest.Mock).mockReturnValue(true);
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '', { ...baseConfig, respectDnd: false });
    expect(play).toHaveBeenCalled();
  });

  it('plays sound when Focus is inactive and respectDnd is true', async () => {
    (isDndActive as jest.Mock).mockReturnValue(false);
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '', { ...baseConfig, respectDnd: true });
    expect(play).toHaveBeenCalled();
  });
});

describe('handleEvent — notification', () => {
  it('plays nothing when notificationEnabled is false', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'permission_prompt' });
    await handleEvent('notification', stdin, { ...baseConfig, notificationEnabled: false });
    expect(play).not.toHaveBeenCalled();
  });

  it('does not play for permission_prompt (handled by PermissionRequest hook)', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'permission_prompt' });
    await handleEvent('notification', stdin, baseConfig);
    expect(play).not.toHaveBeenCalled();
  });

  it('plays ping for idle_prompt', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'idle_prompt' });
    await handleEvent('notification', stdin, baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/ping.wav', 50);
  });

  it('plays ping for elicitation_dialog', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'elicitation_dialog' });
    await handleEvent('notification', stdin, baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/ping.wav', 50);
  });

  it('plays ping for StopFailure', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ hook_event_name: 'StopFailure' });
    await handleEvent('notification', stdin, baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/ping.wav', 50);
  });

  it('plays ping for PermissionRequest', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ hook_event_name: 'PermissionRequest', tool_name: 'Bash' });
    await handleEvent('notification', stdin, baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/ping.wav', 50);
  });

  it('plays nothing for StopFailure when notificationEnabled is false', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ hook_event_name: 'StopFailure' });
    await handleEvent('notification', stdin, { ...baseConfig, notificationEnabled: false });
    expect(play).not.toHaveBeenCalled();
  });

  it('plays nothing for non-actionable notification types', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'task_completed' });
    await handleEvent('notification', stdin, baseConfig);
    expect(play).not.toHaveBeenCalled();
  });

  it('plays nothing when notification_type is missing', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('notification', '{}', baseConfig);
    expect(play).not.toHaveBeenCalled();
  });

  it('plays nothing for invalid JSON', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('notification', 'not json', baseConfig);
    expect(play).not.toHaveBeenCalled();
  });

  it('plays nothing for idle_prompt when idlePromptEnabled is false', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'idle_prompt' });
    await handleEvent('notification', stdin, { ...baseConfig, idlePromptEnabled: false });
    expect(play).not.toHaveBeenCalled();
  });

  it('still plays for other types when idlePromptEnabled is false', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'elicitation_dialog' });
    await handleEvent('notification', stdin, { ...baseConfig, idlePromptEnabled: false });
    expect(play).toHaveBeenCalledWith('/sounds/ping.wav', 50);
  });
});

describe('handleEvent — stop', () => {
  it('plays done sound', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '{}', baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/done.wav', 50);
  });

  it('plays nothing when stopEnabled is false', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '{}', { ...baseConfig, stopEnabled: false });
    expect(play).not.toHaveBeenCalled();
  });
});

describe('handleEvent — alert modes', () => {
  it('shows notification and plays sound when mode is "both"', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '', { ...baseConfig, alertMode: 'both' });
    expect(play).toHaveBeenCalled();
    expect(showNotification).toHaveBeenCalled();
  });

  it('shows notification only when mode is "notification"', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '', { ...baseConfig, alertMode: 'notification' });
    expect(play).not.toHaveBeenCalled();
    expect(showNotification).toHaveBeenCalled();
  });

  it('plays sound only when mode is "sound" (default)', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '', { ...baseConfig, alertMode: 'sound' });
    expect(play).toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  it('passes correct message for PermissionRequest notification', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ hook_event_name: 'PermissionRequest' });
    await handleEvent('notification', stdin, { ...baseConfig, alertMode: 'notification' });
    expect(showNotification).toHaveBeenCalledWith(
      'Agent Ping',
      expect.stringContaining('permission')
    );
  });
});
