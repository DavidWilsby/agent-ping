const mockExecSync = jest.fn();

jest.mock('child_process', () => ({
  execSync: mockExecSync,
}));

beforeEach(() => {
  mockExecSync.mockReset();
});

describe('isDndActive', () => {
  it('returns false on non-macOS platforms', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    jest.resetModules();
    const { isDndActive } = require('../src/dnd');
    expect(isDndActive()).toBe(false);
    expect(mockExecSync).not.toHaveBeenCalled();
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('returns true when Focus menu bar item is present', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    mockExecSync.mockReturnValue('true\n');
    jest.resetModules();
    const { isDndActive } = require('../src/dnd');
    expect(isDndActive()).toBe(true);
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('returns false when Focus menu bar item is absent', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    mockExecSync.mockReturnValue('false\n');
    jest.resetModules();
    const { isDndActive } = require('../src/dnd');
    expect(isDndActive()).toBe(false);
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('returns false when the command throws', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    mockExecSync.mockImplementation(() => { throw new Error('osascript failed'); });
    jest.resetModules();
    const { isDndActive } = require('../src/dnd');
    expect(isDndActive()).toBe(false);
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('returns false on timeout', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    mockExecSync.mockImplementation(() => { throw Object.assign(new Error('timed out'), { killed: true }); });
    jest.resetModules();
    const { isDndActive } = require('../src/dnd');
    expect(isDndActive()).toBe(false);
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });
});
