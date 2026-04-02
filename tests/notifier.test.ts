import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.agent-ping-vscode');
const LOCK_PATH = path.join(CONFIG_DIR, 'extension.lock');
const EVENT_PATH = path.join(CONFIG_DIR, 'event.json');

jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({ unref: jest.fn(), on: jest.fn() }),
}));

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

beforeEach(() => {
  mockSpawn.mockClear();
  mockSpawn.mockReturnValue({ unref: jest.fn(), on: jest.fn() } as any);
  // Ensure no lock file exists (CLI-only mode)
  try { fs.unlinkSync(LOCK_PATH); } catch { /* ignore */ }
  try { fs.unlinkSync(EVENT_PATH); } catch { /* ignore */ }
});

afterAll(() => {
  try { fs.unlinkSync(LOCK_PATH); } catch { /* ignore */ }
  try { fs.unlinkSync(EVENT_PATH); } catch { /* ignore */ }
});

describe('showNotification — CLI-only (no lock file)', () => {
  it('calls osascript on macOS', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    jest.resetModules();
    jest.mock('child_process', () => ({
      spawn: jest.fn().mockReturnValue({ unref: jest.fn(), on: jest.fn() }),
    }));
    const { showNotification } = require('../src/notifier');
    const { spawn: s } = require('child_process');
    showNotification('Agent Ping', 'Task done');
    expect(s).toHaveBeenCalledWith(
      'osascript',
      expect.arrayContaining(['-e']),
      expect.any(Object)
    );
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('calls notify-send with icon on Linux', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    jest.resetModules();
    jest.mock('child_process', () => ({
      spawn: jest.fn().mockReturnValue({ unref: jest.fn(), on: jest.fn() }),
    }));
    const { showNotification } = require('../src/notifier');
    const { spawn: s } = require('child_process');
    showNotification('Agent Ping', 'Task done');
    expect(s).toHaveBeenCalledWith(
      'notify-send',
      expect.arrayContaining(['-i', expect.stringContaining('icon.png'), 'Agent Ping', 'Task done']),
      expect.any(Object)
    );
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('calls powershell on Windows', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    jest.resetModules();
    jest.mock('child_process', () => ({
      spawn: jest.fn().mockReturnValue({ unref: jest.fn(), on: jest.fn() }),
    }));
    const { showNotification } = require('../src/notifier');
    const { spawn: s } = require('child_process');
    showNotification('Agent Ping', 'Task done');
    expect(s).toHaveBeenCalledWith(
      'powershell',
      expect.any(Array),
      expect.any(Object)
    );
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('escapes double quotes in osascript strings', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    jest.resetModules();
    jest.mock('child_process', () => ({
      spawn: jest.fn().mockReturnValue({ unref: jest.fn(), on: jest.fn() }),
    }));
    const { showNotification } = require('../src/notifier');
    const { spawn: s } = require('child_process');
    showNotification('Test "title"', 'A "quoted" message');
    const args = s.mock.calls[0][1];
    expect(args[1]).toContain('\\"quoted\\"');
    expect(args[1]).toContain('\\"title\\"');
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('does not throw when spawn fails', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    jest.resetModules();
    jest.mock('child_process', () => ({
      spawn: jest.fn().mockImplementation(() => { throw new Error('spawn failed'); }),
    }));
    const { showNotification } = require('../src/notifier');
    expect(() => showNotification('Test', 'Message')).not.toThrow();
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });
});

describe('showNotification — extension active (lock file present)', () => {
  beforeEach(() => {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(LOCK_PATH, '12345', 'utf-8');
  });

  afterEach(() => {
    try { fs.unlinkSync(LOCK_PATH); } catch { /* ignore */ }
    try { fs.unlinkSync(EVENT_PATH); } catch { /* ignore */ }
  });

  it('writes event file instead of calling osascript', () => {
    jest.resetModules();
    jest.mock('child_process', () => ({
      spawn: jest.fn().mockReturnValue({ unref: jest.fn(), on: jest.fn() }),
    }));
    const { showNotification } = require('../src/notifier');
    const { spawn: s } = require('child_process');
    showNotification('Agent Ping', 'Task done');
    expect(s).not.toHaveBeenCalled();
    expect(fs.existsSync(EVENT_PATH)).toBe(true);
    const event = JSON.parse(fs.readFileSync(EVENT_PATH, 'utf-8'));
    expect(event.title).toBe('Agent Ping');
    expect(event.message).toBe('Task done');
    expect(event.timestamp).toBeDefined();
  });
});
