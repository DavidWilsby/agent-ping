import { spawn } from 'child_process';

jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({ unref: jest.fn(), on: jest.fn() }),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

beforeEach(() => {
  mockSpawn.mockClear();
  mockSpawn.mockReturnValue({ unref: jest.fn(), on: jest.fn() } as any);
});

describe('play', () => {
  it('does nothing if sound file does not exist', () => {
    const fs = require('fs');
    fs.existsSync.mockReturnValueOnce(false);
    const { play } = require('../src/player');
    play('/nonexistent/sound.wav', 50);
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('does nothing if volume is 0', () => {
    const { play } = require('../src/player');
    play('/test/sound.wav', 0);
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('calls afplay with -v flag on macOS', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    const { play } = require('../src/player');
    play('/test/sound.wav', 50);
    expect(mockSpawn).toHaveBeenCalledWith(
      'afplay', ['-v', '0.5', '/test/sound.wav'],
      { detached: true, stdio: 'ignore' }
    );
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('maps volume 100 to afplay -v 1', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    const { play } = require('../src/player');
    play('/test/sound.wav', 100);
    expect(mockSpawn).toHaveBeenCalledWith(
      'afplay', ['-v', '1', '/test/sound.wav'],
      { detached: true, stdio: 'ignore' }
    );
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('calls paplay with --volume flag on Linux', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    jest.resetModules();
    jest.mock('child_process', () => ({
      spawn: jest.fn().mockReturnValue({ unref: jest.fn(), on: jest.fn() }),
    }));
    jest.mock('fs', () => ({ existsSync: jest.fn().mockReturnValue(true) }));
    const { play } = require('../src/player');
    const { spawn: s } = require('child_process');
    play('/test/sound.wav', 50);
    expect(s).toHaveBeenCalledWith(
      'paplay', ['--volume=32768', '/test/sound.wav'],
      expect.any(Object)
    );
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });
});
