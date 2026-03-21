# Settings UI Improvements — Design Spec

**Date:** 2026-03-21
**Project:** agent-ping VS Code extension
**Status:** Approved

---

## Goal

Improve the settings UI for non-technical users by adding file picker commands and test/reset actions for sound settings — reducing reliance on manually typing file paths. Targets VS Code, Cursor, and Windsurf (all VS Code-compatible editors).

---

## Approach

Use VS Code Command Palette commands plus inline `markdownDescription` links in the standard settings panel. No custom webview required.

Three of the four sound settings (`stopSound`, `notificationSound`, `permissionSound`) each get three clickable links rendered directly inside the VS Code settings panel, below the existing text field:

- **Choose file…** — opens a native file picker dialog, writes the selected path to the setting
- **Test sound** — plays the currently configured sound immediately
- **Reset to default** — clears the path (empty string), falling back to the bundled default

`singleSound` is intentionally excluded from action commands. It is a power-user convenience setting and the per-event commands (Stop, Notification, Permission) cover the primary use case for the target audience.

---

## Commands

9 commands total — one set of three per event type (Stop, Notification, Permission). `singleSound` gets no commands.

| Command ID | Title |
|---|---|
| `agentPing.chooseStopSound` | Agent Ping: Choose Stop Sound |
| `agentPing.testStopSound` | Agent Ping: Test Stop Sound |
| `agentPing.resetStopSound` | Agent Ping: Reset Stop Sound to Default |
| `agentPing.chooseNotificationSound` | Agent Ping: Choose Notification Sound |
| `agentPing.testNotificationSound` | Agent Ping: Test Notification Sound |
| `agentPing.resetNotificationSound` | Agent Ping: Reset Notification Sound to Default |
| `agentPing.choosePermissionSound` | Agent Ping: Choose Permission Sound |
| `agentPing.testPermissionSound` | Agent Ping: Test Permission Sound |
| `agentPing.resetPermissionSound` | Agent Ping: Reset Permission Sound to Default |

All commands are registered in `package.json` under `contributes.commands` and implemented in `src/extension.ts`.

---

## Settings Panel Changes

`stopSound`, `notificationSound`, and `permissionSound` switch from `description` to `markdownDescription`. `singleSound` keeps its plain `description`, replaced in full with updated text that mentions compatible formats.

Pattern for the three event settings (shown for Stop — substitute the correct command IDs for Notification and Permission):

```
Path to a WAV, MP3, or AIFF (.aiff or .aif) sound file. Leave empty to use the bundled default.

[Choose file…](command:agentPing.chooseStopSound) · [Test sound](command:agentPing.testStopSound) · [Reset to default](command:agentPing.resetStopSound)
```

`singleSound` — full replacement for the existing `description` string:

```
Path to a WAV, MP3, or AIFF (.aiff or .aif) sound file used for all events when Use Single Sound is enabled. Leave empty to use the bundled default.
```

**Note on command link rendering:** Command links in `markdownDescription` work in VS Code 1.80+, Cursor, and Windsurf without additional settings, for any installed and trusted extension. They do not render in restricted mode, untrusted workspaces, or web-only environments — users in those contexts can still use the Command Palette directly.

---

## Command Behaviour

In all command handlers:
- `cfg` refers to `vscode.workspace.getConfiguration('agentPing')`
- `settingKey` is the string key for the relevant setting: `'stopSound'`, `'notificationSound'`, or `'permissionSound'` — each handler is bound to one specific key

### Choose file
1. Call `vscode.window.showOpenDialog()` with filter `{ 'Sound files': ['wav', 'mp3', 'aiff', 'aif'] }`
2. If the user cancels (result is `undefined`), do nothing
3. If a file is selected, call `cfg.update(settingKey, filePath, vscode.ConfigurationTarget.Global)`
4. If `cfg.update` throws, call `vscode.window.showErrorMessage('Agent Ping: Could not save setting.')`
5. On success, no additional feedback is needed — the settings panel text field updates automatically when the setting changes
6. The existing `onDidChangeConfiguration` listener syncs the new value to `~/.agent-ping/config.json` automatically

### Test sound
1. Read the current path with `cfg.get<string>(settingKey)`
2. If the value is empty or undefined, substitute `BUNDLED_DEFAULTS[settingKey]` from `config.ts`. `BUNDLED_DEFAULTS` has the shape `{ stopSound: string, notificationSound: string, permissionSound: string, singleSound: string, ... }` — the keys match VS Code setting names
3. Check file existence with `fs.existsSync(resolvedPath)` — if false, call `vscode.window.showErrorMessage('Agent Ping: Could not play sound. Check that the file path is correct.')` and return
4. Call `play(resolvedPath)` from `player.ts` inside a try/catch — if it throws, call `vscode.window.showErrorMessage('Agent Ping: Could not play sound.')`

> VS Code settings are read directly (not via `resolveConfig()`) to avoid a sync race: `resolveConfig()` reads from `~/.agent-ping/config.json`, which is only updated after `onDidChangeConfiguration` fires. Reading from `cfg` guarantees the test plays what the user currently sees in the panel. Edge case: if the user triggers the test via Command Palette before the settings input field has blurred (and thus before VS Code has auto-saved the new value), `cfg.get()` may return the previous value. This is acceptable — VS Code settings fields persist on blur and this scenario is unlikely in practice.

> `play()` already returns silently when a file is missing, but we check existence first to surface a useful error message to the user.

### Reset to default
1. Call `cfg.update(settingKey, '', vscode.ConfigurationTarget.Global)`
2. `config.ts` already treats empty string as "use bundled default" — no additional logic needed
3. The settings panel text field clears automatically when the setting updates (same mechanism as Choose file) — no additional user feedback required

---

## Files Changed

| File | Change |
|---|---|
| `package.json` | Add 9 entries to `contributes.commands`; switch `stopSound`, `notificationSound`, `permissionSound` to `markdownDescription` with action links; replace `description` on `singleSound` with updated text mentioning compatible formats |
| `src/extension.ts` | Register 9 command handlers in `activate()`; import `BUNDLED_DEFAULTS` from `config.ts` and `play` from `player.ts` for test commands |
| `src/config.ts` | Add `export` to `BUNDLED_DEFAULTS` (currently an unexported `const`) so `extension.ts` can reference it for test-sound fallback |

`singleSound` continues to participate in the existing `onDidChangeConfiguration` sync to `~/.agent-ping/config.json` — no change to that logic.

---

## Out of Scope

- Custom webview settings panel
- Commands for `singleSound` (choose/test/reset)
- Status bar or activity bar surface area
- Sound preview before confirming file selection
