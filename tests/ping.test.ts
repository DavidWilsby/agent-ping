import { Config } from '../src/config';

jest.mock('../src/player', () => ({ play: jest.fn() }));

const { play } = require('../src/player');

const baseConfig: Config = {
  enabled: true,
  notificationSound: '/sounds/ping.wav',
  stopSound: '/sounds/done.wav',
  notificationEnabled: true,
  stopEnabled: true,
};

beforeEach(() => {
  (play as jest.Mock).mockClear();
});

describe('handleEvent — enabled: false', () => {
  it('plays nothing when disabled', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('notification', '{}', { ...baseConfig, enabled: false });
    expect(play).not.toHaveBeenCalled();
  });
});

describe('handleEvent — notification', () => {
  it('plays nothing when notificationEnabled is false', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'permission_prompt' });
    await handleEvent('notification', stdin, { ...baseConfig, notificationEnabled: false });
    expect(play).not.toHaveBeenCalled();
  });

  it('plays ping for permission_prompt', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'permission_prompt' });
    await handleEvent('notification', stdin, baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/ping.wav');
  });

  it('plays ping for idle_prompt', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'idle_prompt' });
    await handleEvent('notification', stdin, baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/ping.wav');
  });

  it('plays ping for elicitation_dialog', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'elicitation_dialog' });
    await handleEvent('notification', stdin, baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/ping.wav');
  });

  it('plays ping for StopFailure', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ hook_event_name: 'StopFailure' });
    await handleEvent('notification', stdin, baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/ping.wav');
  });

  it('plays nothing for StopFailure when notificationEnabled is false', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ hook_event_name: 'StopFailure' });
    await handleEvent('notification', stdin, { ...baseConfig, notificationEnabled: false });
    expect(play).not.toHaveBeenCalled();
  });

  it('plays for any notification type', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('notification', '{}', baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/ping.wav');
  });
});

describe('handleFilteredNotification', () => {
  it('plays ping for permission_prompt', () => {
    const { handleFilteredNotification } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'permission_prompt' });
    handleFilteredNotification(stdin, baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/ping.wav');
  });

  it('plays ping for idle_prompt', () => {
    const { handleFilteredNotification } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'idle_prompt' });
    handleFilteredNotification(stdin, baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/ping.wav');
  });

  it('plays ping for elicitation_dialog', () => {
    const { handleFilteredNotification } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'elicitation_dialog' });
    handleFilteredNotification(stdin, baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/ping.wav');
  });

  it('plays nothing for non-actionable notification types', () => {
    const { handleFilteredNotification } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'task_completed' });
    handleFilteredNotification(stdin, baseConfig);
    expect(play).not.toHaveBeenCalled();
  });

  it('plays nothing when notification_type is missing', () => {
    const { handleFilteredNotification } = require('../src/ping');
    handleFilteredNotification('{}', baseConfig);
    expect(play).not.toHaveBeenCalled();
  });

  it('plays nothing for invalid JSON', () => {
    const { handleFilteredNotification } = require('../src/ping');
    handleFilteredNotification('not json', baseConfig);
    expect(play).not.toHaveBeenCalled();
  });

  it('plays nothing when disabled', () => {
    const { handleFilteredNotification } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'idle_prompt' });
    handleFilteredNotification(stdin, { ...baseConfig, enabled: false });
    expect(play).not.toHaveBeenCalled();
  });

  it('plays nothing when notificationEnabled is false', () => {
    const { handleFilteredNotification } = require('../src/ping');
    const stdin = JSON.stringify({ notification_type: 'idle_prompt' });
    handleFilteredNotification(stdin, { ...baseConfig, notificationEnabled: false });
    expect(play).not.toHaveBeenCalled();
  });
});

describe('handleEvent — stop', () => {
  it('plays done sound', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '{}', baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/done.wav');
  });

  it('plays nothing when stopEnabled is false', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '{}', { ...baseConfig, stopEnabled: false });
    expect(play).not.toHaveBeenCalled();
  });
});
