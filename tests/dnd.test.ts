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

  it('returns true when Focus is active on macOS', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    mockExecSync.mockReturnValue('1\n');
    jest.resetModules();
    const { isDndActive } = require('../src/dnd');
    expect(isDndActive()).toBe(true);
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('returns false when Focus is inactive on macOS', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    mockExecSync.mockReturnValue('0\n');
    jest.resetModules();
    const { isDndActive } = require('../src/dnd');
    expect(isDndActive()).toBe(false);
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('returns false when the command throws', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    mockExecSync.mockImplementation(() => { throw new Error('key not found'); });
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
