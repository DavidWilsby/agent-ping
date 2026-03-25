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
  delete process.env.AGENT_PING_STOP_SOUND;
  delete process.env.AGENT_PING_NOTIFICATION_SOUND;
  delete process.env.AGENT_PING_VOLUME;
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
    expect(config.stopEnabled).toBe(true);
    expect(config.notificationEnabled).toBe(true);
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

  it('env var AGENT_PING_NOTIFICATION_SOUND overrides notification sound', () => {
    process.env.AGENT_PING_NOTIFICATION_SOUND = '/custom/ping.wav';
    mockReadFileSync.mockImplementation((p: string) => {
      if (String(p).includes('.agent-ping')) throw new Error('not found');
      return jest.requireActual<typeof import('fs')>('fs').readFileSync(p, 'utf-8');
    });
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.notificationSound).toBe('/custom/ping.wav');
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

  it('returns default volume of 50 when not configured', () => {
    mockReadFileSync.mockImplementation((p: string) => {
      if (String(p).includes('.agent-ping')) throw new Error('not found');
      return jest.requireActual<typeof import('fs')>('fs').readFileSync(p, 'utf-8');
    });
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.volume).toBe(50);
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
  it('AGENT_PING_VOLUME env var overrides config', () => {
    process.env.AGENT_PING_VOLUME = '80';
    mockReadFileSync.mockImplementation((p: string) => {
      if (String(p).includes('.agent-ping')) return JSON.stringify({ volume: 30 });
      return jest.requireActual<typeof import('fs')>('fs').readFileSync(p, 'utf-8');
    });
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.volume).toBe(80);
  });

  it('clamps volume above 100 to 100', () => {
    mockReadFileSync.mockImplementation((p: string) => {
      if (String(p).includes('.agent-ping')) return JSON.stringify({ volume: 200 });
      return jest.requireActual<typeof import('fs')>('fs').readFileSync(p, 'utf-8');
    });
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.volume).toBe(100);
  });

  it('clamps volume below 0 to 0', () => {
    mockReadFileSync.mockImplementation((p: string) => {
      if (String(p).includes('.agent-ping')) return JSON.stringify({ volume: -10 });
      return jest.requireActual<typeof import('fs')>('fs').readFileSync(p, 'utf-8');
    });
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.volume).toBe(0);
  });

  it('ignores non-numeric AGENT_PING_VOLUME', () => {
    process.env.AGENT_PING_VOLUME = 'abc';
    mockReadFileSync.mockImplementation((p: string) => {
      if (String(p).includes('.agent-ping')) throw new Error('not found');
      return jest.requireActual<typeof import('fs')>('fs').readFileSync(p, 'utf-8');
    });
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.volume).toBe(50);
  });

  it('falls back to default for non-numeric volume in config file', () => {
    mockReadFileSync.mockImplementation((p: string) => {
      if (String(p).includes('.agent-ping')) return JSON.stringify({ volume: 'fifty' });
      return jest.requireActual<typeof import('fs')>('fs').readFileSync(p, 'utf-8');
    });
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.volume).toBe(50);
  });
});

describe('BUNDLED_DEFAULTS', () => {
  it('is exported and contains sound path keys', () => {
    const { BUNDLED_DEFAULTS } = require('../src/config');
    expect(BUNDLED_DEFAULTS).toBeDefined();
    expect(typeof BUNDLED_DEFAULTS.stopSound).toBe('string');
    expect(typeof BUNDLED_DEFAULTS.notificationSound).toBe('string');
    expect(BUNDLED_DEFAULTS.stopSound.length).toBeGreaterThan(0);
  });
});
