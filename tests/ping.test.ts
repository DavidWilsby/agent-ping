import { Config } from '../src/config';

jest.mock('../src/player', () => ({ play: jest.fn() }));
jest.mock('../src/detector', () => ({ detectQuestion: jest.fn().mockReturnValue(false) }));

const { play } = require('../src/player');
const { detectQuestion } = require('../src/detector');

const baseConfig: Config = {
  enabled: true,
  stopSound: '/sounds/stop.wav',
  notificationSound: '/sounds/notification.wav',
  permissionSound: '/sounds/notification.wav',
  questionDetection: true,
  stopEnabled: true,
  notificationEnabled: true,
  permissionEnabled: true,
};

beforeEach(() => {
  (play as jest.Mock).mockClear();
  (detectQuestion as jest.Mock).mockReturnValue(false);
});

describe('handleEvent — enabled: false', () => {
  it('plays nothing when disabled', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '{}', { ...baseConfig, enabled: false });
    expect(play).not.toHaveBeenCalled();
  });
});

describe('handleEvent — notification', () => {
  it('plays notification sound', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('notification', '{}', baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/notification.wav');
  });

  it('plays nothing when notificationEnabled is false', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('notification', '{}', { ...baseConfig, notificationEnabled: false });
    expect(play).not.toHaveBeenCalled();
  });
});

describe('handleEvent — permission', () => {
  it('plays permission sound when permission_suggestions is non-empty', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ permission_suggestions: [{ type: 'addRules' }] });
    await handleEvent('permission', stdin, baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/notification.wav');
  });

  it('plays nothing when permission_suggestions is empty', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('permission', JSON.stringify({ permission_suggestions: [] }), baseConfig);
    expect(play).not.toHaveBeenCalled();
  });

  it('plays nothing when permissionEnabled is false', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ permission_suggestions: [{ type: 'addRules' }] });
    await handleEvent('permission', stdin, { ...baseConfig, permissionEnabled: false });
    expect(play).not.toHaveBeenCalled();
  });
});

describe('handleEvent — stop', () => {
  it('plays stop sound when no question detected', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', JSON.stringify({ transcript_path: '/fake/path.jsonl' }), baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/stop.wav');
  });

  it('plays notification sound when question detected', async () => {
    (detectQuestion as jest.Mock).mockReturnValue(true);
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', JSON.stringify({ transcript_path: '/fake/path.jsonl' }), baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/notification.wav');
  });

  it('plays stop sound without question detection when questionDetection is false', async () => {
    (detectQuestion as jest.Mock).mockReturnValue(true);
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '{}', { ...baseConfig, questionDetection: false });
    expect(play).toHaveBeenCalledWith('/sounds/stop.wav');
  });

  it('plays nothing when stopEnabled is false', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '{}', { ...baseConfig, stopEnabled: false });
    expect(play).not.toHaveBeenCalled();
  });
});
