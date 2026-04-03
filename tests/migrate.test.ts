import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const mockExistsSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockWriteFileSync = jest.fn();
const mockMkdirSync = jest.fn();

jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    mkdirSync: mockMkdirSync,
  };
});

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  process.env.CLAUDE_PLUGIN_DATA = '/tmp/agent-ping-test';
});

afterEach(() => {
  delete process.env.CLAUDE_PLUGIN_DATA;
});

describe('migrateIfNeeded', () => {
  it('copies legacy config to plugin data dir', () => {
    const legacyConfig = JSON.stringify({ volume: 80, alertMode: 'both' });
    const legacyPath = path.join(os.homedir(), '.agent-ping-vscode', 'config.json');
    const markerPath = '/tmp/agent-ping-test/.migrated';

    mockExistsSync.mockImplementation((p: any) => {
      if (String(p) === markerPath) return false;
      if (String(p) === legacyPath) return true;
      return false;
    });
    mockReadFileSync.mockImplementation((p: any) => {
      if (String(p) === legacyPath) return legacyConfig;
      throw new Error('not found');
    });

    const { migrateIfNeeded } = require('../src/migrate');
    migrateIfNeeded();

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      '/tmp/agent-ping-test/config.json',
      legacyConfig,
      'utf-8'
    );
  });

  it('skips migration if marker file exists', () => {
    const markerPath = '/tmp/agent-ping-test/.migrated';
    mockExistsSync.mockImplementation((p: any) => {
      if (String(p) === markerPath) return true;
      return false;
    });

    const { migrateIfNeeded } = require('../src/migrate');
    migrateIfNeeded();

    expect(mockReadFileSync).not.toHaveBeenCalled();
  });

  it('removes legacy hooks from settings.json', () => {
    const markerPath = '/tmp/agent-ping-test/.migrated';
    const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
    const legacySettings = JSON.stringify({
      hooks: {
        Stop: [{ matcher: '', hooks: [{ type: 'command', command: 'agent-ping-vscode stop' }] }],
        Notification: [{ matcher: '', hooks: [{ type: 'command', command: 'agent-ping-vscode notification' }] }],
      }
    });

    mockExistsSync.mockImplementation((p: any) => {
      if (String(p) === markerPath) return false;
      if (String(p) === settingsPath) return true;
      return false;
    });
    mockReadFileSync.mockImplementation((p: any) => {
      if (String(p) === settingsPath) return legacySettings;
      throw new Error('not found');
    });

    const { migrateIfNeeded } = require('../src/migrate');
    migrateIfNeeded();

    const writtenSettings = JSON.parse(mockWriteFileSync.mock.calls.find(
      (call: any[]) => String(call[0]) === settingsPath
    )![1] as string);
    expect(writtenSettings.hooks.Stop).toHaveLength(0);
    expect(writtenSettings.hooks.Notification).toHaveLength(0);
  });

  it('writes marker file after migration', () => {
    const markerPath = '/tmp/agent-ping-test/.migrated';
    mockExistsSync.mockReturnValue(false);

    const { migrateIfNeeded } = require('../src/migrate');
    migrateIfNeeded();

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      markerPath,
      expect.any(String),
      'utf-8'
    );
  });
});
