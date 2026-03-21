const mockReadFileSync = jest.fn();

jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actual,
    readFileSync: mockReadFileSync,
  };
});

// Reset modules between tests to clear require cache
beforeEach(() => {
  jest.resetModules();
  delete process.env.AGENT_PING_SOUND;
  delete process.env.AGENT_PING_STOP_SOUND;
  delete process.env.AGENT_PING_NOTIFICATION_SOUND;
  mockReadFileSync.mockReset();
});

describe('resolveConfig', () => {
  it('returns bundled defaults when no env vars or config file', () => {
    mockReadFileSync.mockImplementation((p: string) => {
      if (String(p).includes('.agent-ping')) throw new Error('not found');
      return jest.requireActual<typeof import('fs')>('fs').readFileSync(p, 'utf-8');
    });
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.enabled).toBe(true);
    expect(config.questionDetection).toBe(true);
    expect(config.stopSound).toContain('Done.aiff');
    expect(config.notificationSound).toContain('Ping.aiff');
  });

  it('env var AGENT_PING_STOP_SOUND overrides stop sound', () => {
    process.env.AGENT_PING_STOP_SOUND = '/custom/stop.wav';
    mockReadFileSync.mockImplementation((p: string) => {
      if (String(p).includes('.agent-ping')) throw new Error('not found');
      return jest.requireActual<typeof import('fs')>('fs').readFileSync(p, 'utf-8');
    });
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.stopSound).toBe('/custom/stop.wav');
  });

  it('AGENT_PING_SOUND sets all sounds when specific vars absent', () => {
    process.env.AGENT_PING_SOUND = '/custom/all.wav';
    mockReadFileSync.mockImplementation((p: string) => {
      if (String(p).includes('.agent-ping')) throw new Error('not found');
      return jest.requireActual<typeof import('fs')>('fs').readFileSync(p, 'utf-8');
    });
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.stopSound).toBe('/custom/all.wav');
    expect(config.notificationSound).toBe('/custom/all.wav');
  });

  it('config file values override bundled defaults', () => {
    const fileConfig = { enabled: false, stopSound: '/file/stop.wav' };
    mockReadFileSync.mockImplementation((p: string) => {
      if (String(p).includes('.agent-ping')) return JSON.stringify(fileConfig);
      return jest.requireActual<typeof import('fs')>('fs').readFileSync(p, 'utf-8');
    });
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.enabled).toBe(false);
    expect(config.stopSound).toBe('/file/stop.wav');
  });

  it('env vars override config file values', () => {
    process.env.AGENT_PING_STOP_SOUND = '/env/stop.wav';
    const fileConfig = { stopSound: '/file/stop.wav' };
    mockReadFileSync.mockImplementation((p: string) => {
      if (String(p).includes('.agent-ping')) return JSON.stringify(fileConfig);
      return jest.requireActual<typeof import('fs')>('fs').readFileSync(p, 'utf-8');
    });
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.stopSound).toBe('/env/stop.wav');
  });
});

describe('BUNDLED_DEFAULTS', () => {
  it('is exported and contains sound path keys', () => {
    const { BUNDLED_DEFAULTS } = require('../src/config');
    expect(BUNDLED_DEFAULTS).toBeDefined();
    expect(typeof BUNDLED_DEFAULTS.stopSound).toBe('string');
    expect(typeof BUNDLED_DEFAULTS.notificationSound).toBe('string');
    expect(typeof BUNDLED_DEFAULTS.permissionSound).toBe('string');
    expect(BUNDLED_DEFAULTS.stopSound.length).toBeGreaterThan(0);
  });
});
