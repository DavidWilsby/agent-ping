# Settings UI Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Choose file / Test sound / Reset to default command actions to the agent-ping VS Code settings panel so non-technical users can configure custom sounds without typing file paths.

**Architecture:** Three changes: (1) export `BUNDLED_DEFAULTS` from `config.ts` so `extension.ts` can use it for fallback sound paths; (2) register 9 commands in `package.json` and update setting descriptions with inline command links; (3) implement the 9 command handlers in `extension.ts`.

**Tech Stack:** TypeScript, VS Code Extension API (`vscode.window.showOpenDialog`, `vscode.workspace.getConfiguration`, `vscode.window.showErrorMessage`), Jest/ts-jest for unit tests, `npm run build` (tsc) for compilation.

---

## File Map

| File | Change |
|---|---|
| `src/config.ts` | Add `export` keyword to `BUNDLED_DEFAULTS` const |
| `package.json` | Add 9 command entries; switch 3 sound settings to `markdownDescription` with action links; update `singleSound` description text |
| `src/extension.ts` | Import `BUNDLED_DEFAULTS` and `play`; register 9 command handlers in `activate()` |
| `tests/config.test.ts` | Add test verifying `BUNDLED_DEFAULTS` is exported with correct shape |

---

## Task 1: Export BUNDLED_DEFAULTS from config.ts

**Files:**
- Modify: `src/config.ts`
- Test: `tests/config.test.ts`

- [ ] **Step 1: Write the failing test**

Add this `describe` block to the bottom of `tests/config.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/david.wilsby/Documents/Coding/GitHub/agent-ping
npm test -- --testPathPattern=config
```

Expected: FAIL — `BUNDLED_DEFAULTS` is `undefined` (not exported)

- [ ] **Step 3: Export BUNDLED_DEFAULTS**

In `src/config.ts`, change line 20:

```typescript
// Before
const BUNDLED_DEFAULTS: Config = {
```

```typescript
// After
export const BUNDLED_DEFAULTS: Config = {
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern=config
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/config.ts tests/config.test.ts
git commit -m "feat: export BUNDLED_DEFAULTS from config.ts"
```

---

## Task 2: Register 9 commands in package.json

**Files:**
- Modify: `package.json`

Note: No unit tests for JSON config. Correctness is verified when the extension builds and commands appear in the Command Palette.

- [ ] **Step 1: Add contributes.commands array**

In `package.json`, add a `"commands"` array inside `"contributes"`, after the closing `}` of `"configuration"`:

```json
"contributes": {
  "configuration": { ... },
  "commands": [
    { "command": "agentPing.chooseStopSound",          "title": "Agent Ping: Choose Stop Sound" },
    { "command": "agentPing.testStopSound",            "title": "Agent Ping: Test Stop Sound" },
    { "command": "agentPing.resetStopSound",           "title": "Agent Ping: Reset Stop Sound to Default" },
    { "command": "agentPing.chooseNotificationSound",  "title": "Agent Ping: Choose Notification Sound" },
    { "command": "agentPing.testNotificationSound",    "title": "Agent Ping: Test Notification Sound" },
    { "command": "agentPing.resetNotificationSound",   "title": "Agent Ping: Reset Notification Sound to Default" },
    { "command": "agentPing.choosePermissionSound",    "title": "Agent Ping: Choose Permission Sound" },
    { "command": "agentPing.testPermissionSound",      "title": "Agent Ping: Test Permission Sound" },
    { "command": "agentPing.resetPermissionSound",     "title": "Agent Ping: Reset Permission Sound to Default" }
  ]
}
```

- [ ] **Step 2: Verify JSON is valid**

```bash
node -e "require('./package.json'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat: register 9 sound configuration commands"
```

---

## Task 3: Update settings descriptions in package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update stopSound**

Replace the `agentPing.stopSound` property in `package.json`:

```json
"agentPing.stopSound": {
  "type": "string",
  "default": "",
  "markdownDescription": "Path to a WAV, MP3, or AIFF (.aiff or .aif) sound file. Leave empty to use the bundled default.\n\n[Choose file…](command:agentPing.chooseStopSound) · [Test sound](command:agentPing.testStopSound) · [Reset to default](command:agentPing.resetStopSound)"
}
```

- [ ] **Step 2: Update notificationSound**

Replace the `agentPing.notificationSound` property:

```json
"agentPing.notificationSound": {
  "type": "string",
  "default": "",
  "markdownDescription": "Path to a WAV, MP3, or AIFF (.aiff or .aif) sound file. Leave empty to use the bundled default.\n\n[Choose file…](command:agentPing.chooseNotificationSound) · [Test sound](command:agentPing.testNotificationSound) · [Reset to default](command:agentPing.resetNotificationSound)"
}
```

- [ ] **Step 3: Update permissionSound**

Replace the `agentPing.permissionSound` property:

```json
"agentPing.permissionSound": {
  "type": "string",
  "default": "",
  "markdownDescription": "Path to a WAV, MP3, or AIFF (.aiff or .aif) sound file. Leave empty to use the bundled default.\n\n[Choose file…](command:agentPing.choosePermissionSound) · [Test sound](command:agentPing.testPermissionSound) · [Reset to default](command:agentPing.resetPermissionSound)"
}
```

- [ ] **Step 4: Update singleSound description**

Replace only the `"description"` value on `agentPing.singleSound` (keep `description`, do not change to `markdownDescription`):

```json
"agentPing.singleSound": {
  "type": "string",
  "default": "",
  "description": "Path to a WAV, MP3, or AIFF (.aiff or .aif) sound file used for all events when Use Single Sound is enabled. Leave empty to use the bundled default."
}
```

- [ ] **Step 5: Verify JSON is valid**

```bash
node -e "require('./package.json'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 6: Commit**

```bash
git add package.json
git commit -m "feat: add inline action links to sound settings descriptions"
```

---

## Task 4: Implement choose file command handlers

**Files:**
- Modify: `src/extension.ts`

The VS Code extension API cannot be unit tested in the Jest/Node environment — verification is by building and testing in the editor (Task 7). Implement all three choose handlers in this task.

- [ ] **Step 1: Add imports to extension.ts**

At the top of `src/extension.ts`, the file already imports `vscode`, `fs`, `path`, `os`, and `Config`. Add `BUNDLED_DEFAULTS` to the config import and `play` from player:

```typescript
import { Config, BUNDLED_DEFAULTS } from './config';
import { play } from './player';
```

- [ ] **Step 2: Add registerChooseCommand helper**

Add this function before `activate()` in `src/extension.ts`:

```typescript
function registerChooseCommand(
  context: vscode.ExtensionContext,
  commandId: string,
  settingKey: keyof Config
): void {
  const disposable = vscode.commands.registerCommand(commandId, async () => {
    const result = await vscode.window.showOpenDialog({
      canSelectMany: false,
      filters: { 'Sound files': ['wav', 'mp3', 'aiff', 'aif'] },
      title: 'Choose Sound File',
    });
    if (!result || result.length === 0) return;
    const cfg = vscode.workspace.getConfiguration('agentPing');
    try {
      await cfg.update(settingKey, result[0].fsPath, vscode.ConfigurationTarget.Global);
    } catch {
      vscode.window.showErrorMessage('Agent Ping: Could not save setting.');
    }
  });
  context.subscriptions.push(disposable);
}
```

- [ ] **Step 3: Register the three choose commands inside activate()**

At the bottom of `activate()`, before the closing `}`, add:

```typescript
registerChooseCommand(context, 'agentPing.chooseStopSound', 'stopSound');
registerChooseCommand(context, 'agentPing.chooseNotificationSound', 'notificationSound');
registerChooseCommand(context, 'agentPing.choosePermissionSound', 'permissionSound');
```

- [ ] **Step 4: Build and test to verify no errors**

```bash
npm run build && npm test
```

Expected: build exits 0, all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/extension.ts
git commit -m "feat: add choose file commands for sound settings"
```

---

## Task 5: Implement test sound command handlers

**Files:**
- Modify: `src/extension.ts`

- [ ] **Step 1: Add registerTestCommand helper**

Add this function before `activate()` in `src/extension.ts`:

```typescript
function registerTestCommand(
  context: vscode.ExtensionContext,
  commandId: string,
  settingKey: keyof Config
): void {
  const disposable = vscode.commands.registerCommand(commandId, () => {
    const cfg = vscode.workspace.getConfiguration('agentPing');
    const rawValue = cfg.get<string>(settingKey);
    const resolvedPath = (rawValue && rawValue.length > 0)
      ? rawValue
      : String(BUNDLED_DEFAULTS[settingKey]);
    if (!fs.existsSync(resolvedPath)) {
      vscode.window.showErrorMessage('Agent Ping: Could not play sound. Check that the file path is correct.');
      return;
    }
    try {
      play(resolvedPath);
    } catch {
      vscode.window.showErrorMessage('Agent Ping: Could not play sound.');
    }
  });
  context.subscriptions.push(disposable);
}
```

- [ ] **Step 2: Register the three test commands inside activate()**

After the three `registerChooseCommand` lines added in Task 4, add:

```typescript
registerTestCommand(context, 'agentPing.testStopSound', 'stopSound');
registerTestCommand(context, 'agentPing.testNotificationSound', 'notificationSound');
registerTestCommand(context, 'agentPing.testPermissionSound', 'permissionSound');
```

- [ ] **Step 3: Build to verify no TypeScript errors**

```bash
npm run build
```

Expected: exits with code 0

- [ ] **Step 4: Commit**

```bash
git add src/extension.ts
git commit -m "feat: add test sound commands for sound settings"
```

---

## Task 6: Implement reset command handlers

**Files:**
- Modify: `src/extension.ts`

- [ ] **Step 1: Add registerResetCommand helper**

Add this function before `activate()` in `src/extension.ts`:

```typescript
function registerResetCommand(
  context: vscode.ExtensionContext,
  commandId: string,
  settingKey: keyof Config
): void {
  const disposable = vscode.commands.registerCommand(commandId, async () => {
    const cfg = vscode.workspace.getConfiguration('agentPing');
    await cfg.update(settingKey, '', vscode.ConfigurationTarget.Global);
  });
  context.subscriptions.push(disposable);
}
```

- [ ] **Step 2: Register the three reset commands inside activate()**

After the three `registerTestCommand` lines added in Task 5, add:

```typescript
registerResetCommand(context, 'agentPing.resetStopSound', 'stopSound');
registerResetCommand(context, 'agentPing.resetNotificationSound', 'notificationSound');
registerResetCommand(context, 'agentPing.resetPermissionSound', 'permissionSound');
```

- [ ] **Step 3: Build and run all tests**

```bash
npm run build && npm test
```

Expected: build exits 0, all tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/extension.ts
git commit -m "feat: add reset to default commands for sound settings"
```

---

## Task 7: Package and manually verify

**Files:**
- No code changes

- [ ] **Step 1: Package the extension**

```bash
npx vsce package
```

Expected: produces `agent-ping-1.0.3.vsix` (or similar) with no warnings about missing commands

- [ ] **Step 2: Install in Cursor**

```bash
cursor --install-extension agent-ping-1.0.3.vsix
```

Then reload Cursor.

- [ ] **Step 3: Verify commands appear in Command Palette**

Open Command Palette (`Cmd+Shift+P`), type "Agent Ping". Confirm all 9 commands are listed:
- Agent Ping: Choose Stop Sound
- Agent Ping: Test Stop Sound
- Agent Ping: Reset Stop Sound to Default
- (same three for Notification and Permission)

- [ ] **Step 4: Verify inline links in settings panel**

Open Settings (`Cmd+,`), search "Agent Ping". Confirm the Stop Sound, Notification Sound, and Permission Sound rows each show three clickable links below the text field.

- [ ] **Step 5: Test the choose flow**

1. Click "Choose file…" under Stop Sound
2. Confirm a file picker opens filtered to sound files
3. Select a file — confirm the text field updates with the path

- [ ] **Step 6: Test the test sound flow**

1. Click "Test sound" under Stop Sound — confirm the sound plays
2. Click "Reset to default" — confirm the text field clears
3. Click "Test sound" again — confirm the bundled default sound plays

- [ ] **Step 7: Bump version, package, publish, and create release**

```bash
npm version patch
npx vsce package
npm publish
gh release create v$(node -p "require('./package.json').version") \
  agent-ping-*.vsix \
  --title "v$(node -p "require('./package.json').version")" \
  --notes "Adds Choose file, Test sound, and Reset to default buttons to the Agent Ping settings panel."
```
