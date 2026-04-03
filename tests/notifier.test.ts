import { spawn } from 'child_process';

jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({ unref: jest.fn(), on: jest.fn() }),
}));

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

beforeEach(() => {
  mockSpawn.mockClear();
  mockSpawn.mockReturnValue({ unref: jest.fn(), on: jest.fn() } as any);
});

describe('showNotification', () => {
  it('calls terminal-notifier on macOS with icon', () => {
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
      expect.stringContaining('terminal-notifier'),
      expect.arrayContaining(['-title', 'Agent Ping', '-message', 'Task done', '-appIcon']),
      expect.any(Object)
    );
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('does not pass -sound flag to terminal-notifier', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    jest.resetModules();
    jest.mock('child_process', () => ({
      spawn: jest.fn().mockReturnValue({ unref: jest.fn(), on: jest.fn() }),
    }));
    const { showNotification } = require('../src/notifier');
    const { spawn: s } = require('child_process');
    showNotification('Agent Ping', 'Task done');
    const args = s.mock.calls[0][1];
    expect(args).not.toContain('-sound');
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
