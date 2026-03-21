import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Reset modules between tests to clear require cache
beforeEach(() => {
  jest.resetModules();
  delete process.env.AGENT_PING_SOUND;
  delete process.env.AGENT_PING_STOP_SOUND;
  delete process.env.AGENT_PING_NOTIFICATION_SOUND;
});

describe('resolveConfig', () => {
  it('returns bundled defaults when no env vars or config file', () => {
    jest.mock('fs', () => ({
      ...jest.requireActual('fs'),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (String(p).includes('.agent-ping')) throw new Error('not found');
        return jest.requireActual('fs').readFileSync(p);
      }),
    }));
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.enabled).toBe(true);
    expect(config.questionDetection).toBe(true);
    expect(config.stopSound).toContain('stop.wav');
    expect(config.notificationSound).toContain('notification.wav');
  });

  it('env var AGENT_PING_STOP_SOUND overrides stop sound', () => {
    process.env.AGENT_PING_STOP_SOUND = '/custom/stop.wav';
    jest.mock('fs', () => ({
      ...jest.requireActual('fs'),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (String(p).includes('.agent-ping')) throw new Error('not found');
        return jest.requireActual('fs').readFileSync(p);
      }),
    }));
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.stopSound).toBe('/custom/stop.wav');
  });

  it('AGENT_PING_SOUND sets all sounds when specific vars absent', () => {
    process.env.AGENT_PING_SOUND = '/custom/all.wav';
    jest.mock('fs', () => ({
      ...jest.requireActual('fs'),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (String(p).includes('.agent-ping')) throw new Error('not found');
        return jest.requireActual('fs').readFileSync(p);
      }),
    }));
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.stopSound).toBe('/custom/all.wav');
    expect(config.notificationSound).toBe('/custom/all.wav');
  });

  it('config file values override bundled defaults', () => {
    const fileConfig = { enabled: false, stopSound: '/file/stop.wav' };
    jest.mock('fs', () => ({
      ...jest.requireActual('fs'),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (String(p).includes('.agent-ping')) return JSON.stringify(fileConfig);
        return jest.requireActual('fs').readFileSync(p);
      }),
    }));
    const { resolveConfig } = require('../src/config');
    const config = resolveConfig();
    expect(config.enabled).toBe(false);
    expect(config.stopSound).toBe('/file/stop.wav');
  });

  it('env vars override config file values', () => {
    process.env.AGENT_PING_STOP_SOUND = '/env/stop.wav';
    const fileConfig = { stopSound: '/file/stop.wav' };
    jest.mock('fs', () => ({
      ...jest.requireActual('fs'),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (String(p).includes('.agent-ping')) return JSON.stringify(fileConfig);
        return jest.requireActual('fs').readFileSync(p);
      }),
    }));
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
    expect(typeof BUNDLED_DEFAULTS.singleSound).toBe('string');
    expect(BUNDLED_DEFAULTS.stopSound.length).toBeGreaterThan(0);
  });
});
