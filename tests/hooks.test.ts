const mockExecSync = jest.fn();
const mockExistsSync = jest.fn();

jest.mock('child_process', () => ({
  execSync: mockExecSync,
}));

jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');
  return { ...actual, existsSync: mockExistsSync };
});

import { buildHookCommand, applyHookEntry, resolveGlobalBinDir, HOOK_EVENT_COMMANDS, HookGroup } from '../src/hooks';

beforeEach(() => {
  mockExecSync.mockReset();
  mockExistsSync.mockReset();
});

describe('HOOK_EVENT_COMMANDS', () => {
  it('registers all required hook events', () => {
    expect(Object.keys(HOOK_EVENT_COMMANDS)).toEqual(
      expect.arrayContaining(['Stop', 'Notification', 'StopFailure', 'PermissionRequest'])
    );
  });
});

describe('resolveGlobalBinDir', () => {
  const originalPlatform = process.platform;
  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('returns bin dir when `which` finds the binary', () => {
    mockExecSync.mockReturnValueOnce('/usr/local/bin/agent-ping-vscode\n');
    expect(resolveGlobalBinDir()).toBe('/usr/local/bin');
  });

  it('falls back to npm prefix when `which` fails', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    mockExecSync
      .mockImplementationOnce(() => { throw new Error('not found'); }) // which fails
      .mockReturnValueOnce('/Users/me/.nvm/versions/node/v20/\n');     // npm prefix
    mockExistsSync.mockReturnValueOnce(true);
    expect(resolveGlobalBinDir()).toBe('/Users/me/.nvm/versions/node/v20/bin');
  });

  it('returns null when binary is not found anywhere', () => {
    mockExecSync.mockImplementation(() => { throw new Error('not found'); });
    mockExistsSync.mockReturnValue(false);
    expect(resolveGlobalBinDir()).toBeNull();
  });

  it('skips npm prefix fallback on Windows', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    mockExecSync.mockImplementation(() => { throw new Error('not found'); });
    expect(resolveGlobalBinDir()).toBeNull();
    // Only one call (where), no npm prefix call
    expect(mockExecSync).toHaveBeenCalledTimes(1);
  });
});

describe('buildHookCommand', () => {
  const originalPlatform = process.platform;
  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('prepends PATH on macOS/Linux when binDir is provided', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    expect(buildHookCommand('stop', '/usr/local/bin')).toBe(
      'PATH="/usr/local/bin:$PATH" agent-ping-vscode stop'
    );
  });

  it('returns bare command when binDir is null', () => {
    expect(buildHookCommand('notification', null)).toBe('agent-ping-vscode notification');
  });

  it('returns bare command on Windows even with binDir', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    expect(buildHookCommand('stop', 'C:\\npm\\bin')).toBe('agent-ping-vscode stop');
  });
});

describe('applyHookEntry', () => {
  const command = 'PATH="/usr/local/bin:$PATH" agent-ping-vscode stop';

  it('appends new group when no agent-ping-vscode hooks exist', () => {
    const existing: HookGroup[] = [];
    const result = applyHookEntry(existing, command);
    expect(result.changed).toBe(true);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].hooks![0].command).toBe(command);
  });

  it('skips when new-style hook already present', () => {
    const existing: HookGroup[] = [
      { hooks: [{ type: 'command', command: 'PATH="/usr/local/bin:$PATH" agent-ping-vscode stop' }] },
    ];
    const result = applyHookEntry(existing, command);
    expect(result.changed).toBe(false);
    expect(result.groups).toBe(existing); // same reference
  });

  it('replaces old-style npx hook in place', () => {
    const existing: HookGroup[] = [
      { hooks: [{ type: 'command', command: 'echo before' }] },
      { hooks: [{ type: 'command', command: 'npx --yes agent-ping-vscode@latest stop' }] },
      { hooks: [{ type: 'command', command: 'echo after' }] },
    ];
    const result = applyHookEntry(existing, command);
    expect(result.changed).toBe(true);
    expect(result.groups).toHaveLength(3);
    expect(result.groups[0].hooks![0].command).toBe('echo before');
    expect(result.groups[1].hooks![0].command).toBe(command);
    expect(result.groups[2].hooks![0].command).toBe('echo after');
  });

  it('preserves other hooks when appending', () => {
    const existing: HookGroup[] = [
      { hooks: [{ type: 'command', command: 'echo other' }] },
    ];
    const result = applyHookEntry(existing, command);
    expect(result.changed).toBe(true);
    expect(result.groups).toHaveLength(2);
    expect(result.groups[0].hooks![0].command).toBe('echo other');
    expect(result.groups[1].hooks![0].command).toBe(command);
  });
});
