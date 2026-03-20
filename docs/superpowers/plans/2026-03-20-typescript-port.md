# Agent Ping TypeScript Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `ping.sh` with a compiled TypeScript/Node.js CLI and VS Code extension that plays sounds on Claude Code hook events.

**Architecture:** Core logic lives in shared TypeScript modules (`config`, `player`, `detector`, `ping`). Two entry points — `cli.ts` (called by hooks via `npx --yes agent-ping@latest <event>`) and `extension.ts` (VS Code extension that writes settings to `~/.agent-ping/config.json` for the CLI to read). Config priority: env vars > `~/.agent-ping/config.json` > bundled defaults.

**Tech Stack:** TypeScript 5, Node.js, VS Code Extension API (`@types/vscode`), Jest + ts-jest for testing.

**Spec:** `docs/superpowers/specs/2026-03-20-typescript-port-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Create | npm metadata, VS Code contributes, scripts, dependencies |
| `tsconfig.json` | Create | TypeScript compiler config |
| `src/config.ts` | Create | Config resolution: env vars → `~/.agent-ping/config.json` → bundled defaults |
| `src/player.ts` | Create | Cross-platform sound playback via `child_process.spawn` |
| `src/detector.ts` | Create | Read JSONL transcript, detect question in last assistant message |
| `src/ping.ts` | Create | Core event orchestration (stop / notification / permission) |
| `src/cli.ts` | Create | Thin CLI entry point — reads argv, pipes stdin to ping.ts |
| `src/extension.ts` | Create | VS Code extension entry point — reads settings, writes config.json |
| `tests/config.test.ts` | Create | Unit tests for resolveConfig() |
| `tests/detector.test.ts` | Create | Unit tests for detectQuestion() |
| `tests/player.test.ts` | Create | Unit tests for play() — verifies correct command is spawned |
| `tests/ping.test.ts` | Create | Integration tests for handleEvent() |
| `hooks/hooks.json` | Modify | Update commands to use `npx --yes agent-ping@latest` |
| `sounds/stop.wav` | Rename | Rename from `end-of-task.wav` |
| `sounds/notification.wav` | Rename | Rename from `ping.wav` |
| `scripts/ping.sh` | Delete | Replaced by CLI |
| `.npmignore` | Create | Exclude `src/`, `docs/`, `.claude-plugin/` from npm publish |
| `.gitignore` | Create | Exclude `dist/`, `node_modules/` |

---

## Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.npmignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "agent-ping",
  "version": "1.0.0",
  "description": "Plays a sound when Claude finishes responding. Works in Cursor, Windsurf, and any Claude Code environment.",
  "main": "dist/extension.js",
  "bin": {
    "agent-ping": "dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "test": "jest",
    "vscode:prepublish": "npm run build"
  },
  "engines": {
    "vscode": "^1.74.0"
  },
  "activationEvents": ["onStartupFinished"],
  "categories": ["Other"],
  "contributes": {
    "configuration": {
      "title": "Agent Ping",
      "properties": {
        "agentPing.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable or disable Agent Ping entirely."
        },
        "agentPing.useSingleSound": {
          "type": "boolean",
          "default": false,
          "description": "Use one sound file for all events instead of per-event sounds."
        },
        "agentPing.singleSound": {
          "type": "string",
          "default": "",
          "description": "Path to sound file used for all events when useSingleSound is true. Leave empty to use the bundled default."
        },
        "agentPing.stopSound": {
          "type": "string",
          "default": "",
          "description": "Path to sound file played when Claude finishes a task. Leave empty to use the bundled default."
        },
        "agentPing.notificationSound": {
          "type": "string",
          "default": "",
          "description": "Path to sound file played when Claude asks a question. Leave empty to use the bundled default."
        },
        "agentPing.permissionSound": {
          "type": "string",
          "default": "",
          "description": "Path to sound file played when a permission prompt appears. Leave empty to use the bundled default."
        },
        "agentPing.questionDetection": {
          "type": "boolean",
          "default": true,
          "description": "Use smart question detection on Stop events to play a different sound when Claude is asking you something."
        },
        "agentPing.stopEnabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable or disable the Stop event sound."
        },
        "agentPing.notificationEnabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable or disable the Notification event sound."
        },
        "agentPing.permissionEnabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable or disable the Permission event sound."
        }
      }
    }
  },
  "devDependencies": {
    "@types/jest": "^29.0.0",
    "@types/node": "^20.0.0",
    "@types/vscode": "^1.74.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "typescript": "^5.0.0"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/tests/**/*.test.ts"]
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
dist/
*.vsix
```

- [ ] **Step 4: Create `.npmignore`**

```
src/
tests/
docs/
.claude-plugin/
.gitignore
tsconfig.json
*.vsix
```

- [ ] **Step 5: Install dependencies**

```bash
cd /Users/david.wilsby/Documents/Coding/GitHub/agent-ping
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Verify TypeScript is available**

```bash
npx tsc --version
```

Expected: `Version 5.x.x`

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json .gitignore .npmignore package-lock.json
git commit -m "chore: add TypeScript project scaffolding"
```

---

## Task 2: Rename bundled sounds

**Files:**
- Rename: `sounds/end-of-task.wav` → `sounds/stop.wav`
- Rename: `sounds/ping.wav` → `sounds/notification.wav`

- [ ] **Step 1: Rename the sound files**

```bash
cd /Users/david.wilsby/Documents/Coding/GitHub/agent-ping/sounds
mv end-of-task.wav stop.wav
mv ping.wav notification.wav
```

- [ ] **Step 2: Verify**

```bash
ls sounds/
```

Expected: `notification.wav  stop.wav  .gitkeep`

- [ ] **Step 3: Update personal settings to reflect new filenames**

In `/Users/david.wilsby/.claude/settings.json`, update env vars:
```json
"AGENT_PING_STOP_SOUND": "/Users/david.wilsby/Documents/Coding/GitHub/agent-ping/sounds/stop.wav",
"AGENT_PING_NOTIFICATION_SOUND": "/Users/david.wilsby/Documents/Coding/GitHub/agent-ping/sounds/notification.wav"
```

- [ ] **Step 4: Commit**

```bash
git add sounds/
git commit -m "chore: rename bundled sounds to stop.wav and notification.wav"
```

---

## Task 3: `src/config.ts`

**Files:**
- Create: `src/config.ts`
- Create: `tests/config.test.ts`

- [ ] **Step 1: Create `tests/config.test.ts` with failing tests**

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern=config
```

Expected: FAIL — `Cannot find module '../src/config'`

- [ ] **Step 3: Create `src/config.ts`**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Config {
  enabled: boolean;
  useSingleSound: boolean;
  singleSound: string;
  stopSound: string;
  notificationSound: string;
  permissionSound: string;
  questionDetection: boolean;
  stopEnabled: boolean;
  notificationEnabled: boolean;
  permissionEnabled: boolean;
}

const SOUNDS_DIR = path.join(__dirname, '..', 'sounds');

const BUNDLED_DEFAULTS: Config = {
  enabled: true,
  useSingleSound: false,
  singleSound: path.join(SOUNDS_DIR, 'notification.wav'),
  stopSound: path.join(SOUNDS_DIR, 'stop.wav'),
  notificationSound: path.join(SOUNDS_DIR, 'notification.wav'),
  permissionSound: path.join(SOUNDS_DIR, 'notification.wav'),
  questionDetection: true,
  stopEnabled: true,
  notificationEnabled: true,
  permissionEnabled: true,
};

function readConfigFile(): Partial<Config> {
  const configPath = path.join(os.homedir(), '.agent-ping', 'config.json');
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as Partial<Config>;
  } catch {
    return {};
  }
}

export function resolveConfig(): Config {
  const fileConfig = readConfigFile();
  const base: Config = { ...BUNDLED_DEFAULTS, ...fileConfig };

  const envSound = process.env.AGENT_PING_SOUND;
  const envStop = process.env.AGENT_PING_STOP_SOUND;
  const envNotify = process.env.AGENT_PING_NOTIFICATION_SOUND;

  if (envStop) base.stopSound = envStop;
  if (envNotify) {
    base.notificationSound = envNotify;
    base.permissionSound = envNotify;
  }
  if (envSound) {
    if (!envStop) base.stopSound = envSound;
    if (!envNotify) {
      base.notificationSound = envSound;
      base.permissionSound = envSound;
    }
  }

  return base;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=config
```

Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/config.ts tests/config.test.ts
git commit -m "feat: add config resolution module"
```

---

## Task 4: `src/player.ts`

**Files:**
- Create: `src/player.ts`
- Create: `tests/player.test.ts`

- [ ] **Step 1: Create `tests/player.test.ts` with failing tests**

```typescript
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
    play('/nonexistent/sound.wav');
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('calls afplay on macOS', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    const { play } = require('../src/player');
    play('/test/sound.wav');
    expect(mockSpawn).toHaveBeenCalledWith('afplay', ['/test/sound.wav'], expect.any(Object));
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('calls paplay on Linux', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    jest.resetModules();
    jest.mock('child_process', () => ({
      spawn: jest.fn().mockReturnValue({ unref: jest.fn(), on: jest.fn() }),
    }));
    jest.mock('fs', () => ({ existsSync: jest.fn().mockReturnValue(true) }));
    const { play } = require('../src/player');
    const { spawn: s } = require('child_process');
    play('/test/sound.wav');
    expect(s).toHaveBeenCalledWith('paplay', ['/test/sound.wav'], expect.any(Object));
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern=player
```

Expected: FAIL — `Cannot find module '../src/player'`

- [ ] **Step 3: Create `src/player.ts`**

```typescript
import { spawn } from 'child_process';
import * as fs from 'fs';

export function play(soundPath: string): void {
  if (!fs.existsSync(soundPath)) return;

  if (process.platform === 'darwin') {
    spawn('afplay', [soundPath], { detached: true, stdio: 'ignore' }).unref();
    return;
  }

  if (process.platform === 'linux') {
    const proc = spawn('paplay', [soundPath], { detached: true, stdio: 'ignore' });
    proc.on('error', () => {
      spawn('aplay', [soundPath], { detached: true, stdio: 'ignore' }).unref();
    });
    proc.unref();
    return;
  }

  if (process.platform === 'win32') {
    spawn(
      'powershell',
      ['-c', `(New-Object Media.SoundPlayer '${soundPath}').PlaySync()`],
      { detached: true, stdio: 'ignore' }
    ).unref();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=player
```

Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/player.ts tests/player.test.ts
git commit -m "feat: add cross-platform audio player"
```

---

## Task 5: `src/detector.ts`

**Files:**
- Create: `src/detector.ts`
- Create: `tests/detector.test.ts`

- [ ] **Step 1: Create `tests/detector.test.ts` with failing tests**

```typescript
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function writeTranscript(lines: object[]): string {
  const tmpPath = path.join(os.tmpdir(), `agent-ping-test-${Date.now()}.jsonl`);
  fs.writeFileSync(tmpPath, lines.map(l => JSON.stringify(l)).join('\n'));
  return tmpPath;
}

afterEach(() => {
  // Clean up temp files
  fs.readdirSync(os.tmpdir())
    .filter(f => f.startsWith('agent-ping-test-'))
    .forEach(f => fs.unlinkSync(path.join(os.tmpdir(), f)));
});

describe('detectQuestion', () => {
  it('returns false for empty transcript', () => {
    const p = writeTranscript([]);
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion(p)).toBe(false);
  });

  it('returns false when last message does not look like a question', () => {
    const p = writeTranscript([
      { type: 'assistant', message: { content: [{ type: 'text', text: 'Done. The files have been updated.' }] } },
    ]);
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion(p)).toBe(false);
  });

  it('returns true when last message ends with ?', () => {
    const p = writeTranscript([
      { type: 'assistant', message: { content: [{ type: 'text', text: 'Shall I proceed?' }] } },
    ]);
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion(p)).toBe(true);
  });

  it('returns true for "would you like" pattern', () => {
    const p = writeTranscript([
      { type: 'assistant', message: { content: [{ type: 'text', text: 'Would you like me to run the tests?' }] } },
    ]);
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion(p)).toBe(true);
  });

  it('returns true for "want me to" pattern', () => {
    const p = writeTranscript([
      { type: 'assistant', message: { content: [{ type: 'text', text: 'I can fix this — want me to proceed?' }] } },
    ]);
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion(p)).toBe(true);
  });

  it('uses last assistant message only, not earlier ones', () => {
    const p = writeTranscript([
      { type: 'assistant', message: { content: [{ type: 'text', text: 'Would you like to proceed?' }] } },
      { type: 'user', message: { content: [{ type: 'text', text: 'yes' }] } },
      { type: 'assistant', message: { content: [{ type: 'text', text: 'Done.' }] } },
    ]);
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion(p)).toBe(false);
  });

  it('returns false for nonexistent transcript path', () => {
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion('/nonexistent/path.jsonl')).toBe(false);
  });

  it('skips malformed JSON lines without throwing', () => {
    const tmpPath = path.join(os.tmpdir(), `agent-ping-test-${Date.now()}.jsonl`);
    fs.writeFileSync(tmpPath, 'not json\n{"type":"assistant","message":{"content":[{"type":"text","text":"Done."}]}}\n');
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion(tmpPath)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern=detector
```

Expected: FAIL — `Cannot find module '../src/detector'`

- [ ] **Step 3: Create `src/detector.ts`**

```typescript
import * as fs from 'fs';

const QUESTION_PATTERN = /\?[\s]*$|want me to|would you like|do you want|shall I|let me know/i;

export function detectQuestion(transcriptPath: string): boolean {
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf-8').split('\n');
    let lastText = '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line) as {
          type?: string;
          message?: { content?: Array<{ type?: string; text?: string }> };
        };
        if (obj.type === 'assistant') {
          for (const block of obj.message?.content ?? []) {
            if (block.type === 'text' && block.text) {
              lastText = block.text.trim();
            }
          }
        }
      } catch {
        // skip malformed lines
      }
    }

    return QUESTION_PATTERN.test(lastText.slice(-500));
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=detector
```

Expected: PASS — 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/detector.ts tests/detector.test.ts
git commit -m "feat: add JSONL transcript question detector"
```

---

## Task 6: `src/ping.ts`

**Files:**
- Create: `src/ping.ts`
- Create: `tests/ping.test.ts`

- [ ] **Step 1: Create `tests/ping.test.ts` with failing tests**

```typescript
import { Config } from '../src/config';

jest.mock('../src/player', () => ({ play: jest.fn() }));
jest.mock('../src/detector', () => ({ detectQuestion: jest.fn().mockReturnValue(false) }));

const { play } = require('../src/player');
const { detectQuestion } = require('../src/detector');

const baseConfig: Config = {
  enabled: true,
  useSingleSound: false,
  singleSound: '/sounds/notification.wav',
  stopSound: '/sounds/stop.wav',
  notificationSound: '/sounds/notification.wav',
  permissionSound: '/sounds/notification.wav',
  questionDetection: true,
  stopEnabled: true,
  notificationEnabled: true,
  permissionEnabled: true,
};

beforeEach(() => {
  (play as jest.Mock).mockClear();
  (detectQuestion as jest.Mock).mockReturnValue(false);
});

describe('handleEvent — enabled: false', () => {
  it('plays nothing when disabled', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '{}', { ...baseConfig, enabled: false });
    expect(play).not.toHaveBeenCalled();
  });
});

describe('handleEvent — notification', () => {
  it('plays notification sound', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('notification', '{}', baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/notification.wav');
  });

  it('plays nothing when notificationEnabled is false', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('notification', '{}', { ...baseConfig, notificationEnabled: false });
    expect(play).not.toHaveBeenCalled();
  });
});

describe('handleEvent — permission', () => {
  it('plays permission sound when permission_suggestions is non-empty', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ permission_suggestions: [{ type: 'addRules' }] });
    await handleEvent('permission', stdin, baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/notification.wav');
  });

  it('plays nothing when permission_suggestions is empty', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('permission', JSON.stringify({ permission_suggestions: [] }), baseConfig);
    expect(play).not.toHaveBeenCalled();
  });

  it('plays nothing when permissionEnabled is false', async () => {
    const { handleEvent } = require('../src/ping');
    const stdin = JSON.stringify({ permission_suggestions: [{ type: 'addRules' }] });
    await handleEvent('permission', stdin, { ...baseConfig, permissionEnabled: false });
    expect(play).not.toHaveBeenCalled();
  });
});

describe('handleEvent — stop', () => {
  it('plays stop sound when no question detected', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', JSON.stringify({ transcript_path: '/fake/path.jsonl' }), baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/stop.wav');
  });

  it('plays notification sound when question detected', async () => {
    (detectQuestion as jest.Mock).mockReturnValue(true);
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', JSON.stringify({ transcript_path: '/fake/path.jsonl' }), baseConfig);
    expect(play).toHaveBeenCalledWith('/sounds/notification.wav');
  });

  it('plays stop sound without question detection when questionDetection is false', async () => {
    (detectQuestion as jest.Mock).mockReturnValue(true);
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '{}', { ...baseConfig, questionDetection: false });
    expect(play).toHaveBeenCalledWith('/sounds/stop.wav');
  });

  it('uses singleSound for stop when useSingleSound is true', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '{}', { ...baseConfig, useSingleSound: true });
    expect(play).toHaveBeenCalledWith('/sounds/notification.wav');
  });

  it('plays nothing when stopEnabled is false', async () => {
    const { handleEvent } = require('../src/ping');
    await handleEvent('stop', '{}', { ...baseConfig, stopEnabled: false });
    expect(play).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern=ping
```

Expected: FAIL — `Cannot find module '../src/ping'`

- [ ] **Step 3: Create `src/ping.ts`**

```typescript
import { Config } from './config';
import { play } from './player';
import { detectQuestion } from './detector';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export type EventType = 'stop' | 'notification' | 'permission';

function resolveSound(config: Config, event: 'stop' | 'notification' | 'permission'): string {
  if (config.useSingleSound) return config.singleSound;
  if (event === 'stop') return config.stopSound;
  if (event === 'notification') return config.notificationSound;
  return config.permissionSound;
}

function findTranscript(sessionId: string): string | null {
  const base = path.join(os.homedir(), '.claude', 'projects');
  function search(dir: string): string | null {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          const result = search(path.join(dir, entry.name));
          if (result) return result;
        } else if (entry.name === `${sessionId}.jsonl`) {
          return path.join(dir, entry.name);
        }
      }
    } catch { /* ignore */ }
    return null;
  }
  return search(base);
}

export async function handleEvent(event: EventType, stdin: string, config: Config): Promise<void> {
  if (!config.enabled) return;

  if (event === 'notification') {
    if (!config.notificationEnabled) return;
    play(resolveSound(config, 'notification'));
    return;
  }

  if (event === 'permission') {
    if (!config.permissionEnabled) return;
    let payload: { permission_suggestions?: unknown[] } = {};
    try { payload = JSON.parse(stdin); } catch { /* ignore */ }
    if ((payload.permission_suggestions ?? []).length > 0) {
      play(resolveSound(config, 'permission'));
    }
    return;
  }

  // stop
  if (!config.stopEnabled) return;

  let payload: { session_id?: string; transcript_path?: string } = {};
  try { payload = JSON.parse(stdin); } catch { /* ignore */ }

  let transcriptPath: string | null = null;
  if (payload.transcript_path && fs.existsSync(payload.transcript_path)) {
    transcriptPath = payload.transcript_path;
  } else if (payload.session_id) {
    transcriptPath = findTranscript(payload.session_id);
  }

  if (config.questionDetection && transcriptPath && detectQuestion(transcriptPath)) {
    play(resolveSound(config, 'notification'));
    return;
  }

  play(resolveSound(config, 'stop'));
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=ping
```

Expected: PASS — 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/ping.ts tests/ping.test.ts
git commit -m "feat: add core event orchestration"
```

---

## Task 7: `src/cli.ts`

**Files:**
- Create: `src/cli.ts`

- [ ] **Step 1: Create `src/cli.ts`**

```typescript
#!/usr/bin/env node
import { resolveConfig } from './config';
import { handleEvent, EventType } from './ping';

const event = process.argv[2] as EventType;
const validEvents: EventType[] = ['stop', 'notification', 'permission'];

if (!validEvents.includes(event)) {
  process.exit(0);
}

let stdin = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk: string) => { stdin += chunk; });
process.stdin.on('end', async () => {
  const config = resolveConfig();
  await handleEvent(event, stdin, config);
});
```

- [ ] **Step 2: Skip — build verification happens in Task 8 Step 2 once `extension.ts` exists**

- [ ] **Step 3: Commit**

```bash
git add src/cli.ts
git commit -m "feat: add CLI entry point"
```

---

## Task 8: `src/extension.ts`

**Files:**
- Create: `src/extension.ts`

- [ ] **Step 1: Create `src/extension.ts`**

```typescript
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Config } from './config';

function readVSCodeConfig(): Partial<Config> {
  const cfg = vscode.workspace.getConfiguration('agentPing');
  return {
    enabled: cfg.get<boolean>('enabled'),
    useSingleSound: cfg.get<boolean>('useSingleSound'),
    singleSound: cfg.get<string>('singleSound') ?? '',
    stopSound: cfg.get<string>('stopSound') ?? '',
    notificationSound: cfg.get<string>('notificationSound') ?? '',
    permissionSound: cfg.get<string>('permissionSound') ?? '',
    questionDetection: cfg.get<boolean>('questionDetection'),
    stopEnabled: cfg.get<boolean>('stopEnabled'),
    notificationEnabled: cfg.get<boolean>('notificationEnabled'),
    permissionEnabled: cfg.get<boolean>('permissionEnabled'),
  };
}

function writeConfigFile(config: Partial<Config>): void {
  const dir = path.join(os.homedir(), '.agent-ping');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(config, null, 2), 'utf-8');
}

export function activate(context: vscode.ExtensionContext): void {
  writeConfigFile(readVSCodeConfig());

  const disposable = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('agentPing')) {
      writeConfigFile(readVSCodeConfig());
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void { /* no-op */ }
```

- [ ] **Step 2: Build and verify the full project compiles**

```bash
npm run build
```

Expected: No errors. `dist/cli.js` and `dist/extension.js` both present.

```bash
ls dist/
```

Expected: `cli.js  cli.d.ts  config.js  config.d.ts  detector.js  detector.d.ts  extension.js  extension.d.ts  ping.js  ping.d.ts  player.js  player.d.ts`

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/extension.ts
git commit -m "feat: add VS Code extension entry point"
```

---

## Task 9: Update hooks and remove `ping.sh`

**Files:**
- Modify: `hooks/hooks.json`
- Delete: `scripts/ping.sh`

- [ ] **Step 1: Update `hooks/hooks.json`**

Replace the entire file content with:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "npx --yes agent-ping@latest stop"
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "npx --yes agent-ping@latest notification"
          }
        ]
      }
    ],
    "PermissionRequest": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "npx --yes agent-ping@latest permission"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Delete `ping.sh`**

```bash
rm /Users/david.wilsby/Documents/Coding/GitHub/agent-ping/scripts/ping.sh
```

Also remove the now-empty `scripts/` directory:

```bash
rmdir /Users/david.wilsby/Documents/Coding/GitHub/agent-ping/scripts
```

- [ ] **Step 3: Update personal settings in `~/.claude/settings.json`**

The hook commands in personal settings still point to `ping.sh`. Update them to use the local `dist/cli.js` for development (so you can test without publishing to npm):

```json
"hooks": {
  "Stop": [{ "hooks": [{ "type": "command", "command": "node /Users/david.wilsby/Documents/Coding/GitHub/agent-ping/dist/cli.js stop" }] }],
  "Notification": [{ "hooks": [{ "type": "command", "command": "node /Users/david.wilsby/Documents/Coding/GitHub/agent-ping/dist/cli.js notification" }] }],
  "PermissionRequest": [{ "hooks": [{ "type": "command", "command": "node /Users/david.wilsby/Documents/Coding/GitHub/agent-ping/dist/cli.js permission" }] }]
}
```

- [ ] **Step 4: Test locally — trigger a Stop event**

Ask Claude to do something and verify the correct sound plays when Claude finishes.

- [ ] **Step 5: Commit**

```bash
git add hooks/hooks.json
git rm scripts/ping.sh
git commit -m "feat: switch hooks to npx CLI, remove ping.sh"
```

---

## Task 10: Final verification and publish prep

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests pass, no failures.

- [ ] **Step 2: Build clean**

```bash
rm -rf dist && npm run build
```

Expected: No errors.

- [ ] **Step 3: Verify `.npmignore` excludes the right files**

```bash
npx npm-packlist
```

Expected output includes: `dist/`, `sounds/`, `hooks/`, `package.json`, `README.md`
Expected output excludes: `src/`, `tests/`, `docs/`, `scripts/` (deleted), `.claude-plugin/`

- [ ] **Step 4: Dry-run publish**

```bash
npm publish --dry-run
```

Review the file list. Confirm `dist/cli.js` is included and `src/` is not.

- [ ] **Step 5: Update README**

Update `README.md` to:
1. Replace `YOUR_GITHUB_USERNAME` with actual GitHub username once repo is pushed
2. Update the events table to include `PermissionRequest`
3. Add a note that `npx --yes agent-ping@latest` is used by hooks (no install needed)
4. Add global install option: `npm install -g agent-ping`

- [ ] **Step 6: Final commit**

```bash
git add README.md
git commit -m "docs: update README for TypeScript port"
```

- [ ] **Step 7: Push to GitHub**

```bash
gh repo create agent-ping --public --source=. --remote=origin --push
```

Then update `README.md` with your actual GitHub username and commit.

- [ ] **Step 8: Publish to npm**

```bash
npm publish
```

Expected: Package published as `agent-ping@1.0.0`.

- [ ] **Step 9: Update personal settings to use npx**

Once published, update `~/.claude/settings.json` hooks back to `npx --yes agent-ping@latest stop` etc. and verify sounds still play correctly.
