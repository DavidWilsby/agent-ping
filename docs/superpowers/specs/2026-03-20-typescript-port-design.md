# Agent Ping — TypeScript Port Design

**Date:** 2026-03-20
**Status:** Approved

## Overview

Port Agent Ping from a bash script to TypeScript, delivering a compiled Node.js CLI (for Claude Code hooks) and a VS Code extension (for settings UI). The repo is published to npm so hooks use `npx --yes agent-ping@latest` — zero build step for end users.

## Goals

- Replace `ping.sh` with a TypeScript/Node.js CLI that hooks call identically
- Expose full user control via VS Code's native settings UI
- Preserve backwards compatibility with env var config for terminal users
- Work in Claude Code CLI (terminal), Cursor, and Windsurf
- Simple install story: Claude Code plugin install wires everything automatically

## Architecture

### Option Chosen: TypeScript CLI + VS Code Extension Wrapper (Option A)

Core logic lives in shared TypeScript modules. Two entry points compile from the same source:

1. **`src/cli.ts`** — called by hooks via `npx --yes agent-ping@latest <event>`
2. **`src/extension.ts`** — VS Code extension entry point, provides settings UI and writes config to disk

### Config Resolution Order

Priority highest → lowest:

1. **Env vars** (`AGENT_PING_STOP_SOUND`, `AGENT_PING_NOTIFICATION_SOUND`, `AGENT_PING_SOUND`) — explicit overrides; take precedence over everything including VS Code settings. Documented as "overrides VS Code settings."
2. **`~/.agent-ping/config.json`** — written by the VS Code extension when settings change; used by the CLI to reflect VS Code settings without env var wiring
3. **Bundled defaults** — sounds shipped in `sounds/` directory

### Hook → CLI Bridge

The VS Code extension writes settings to `~/.agent-ping/config.json` on change. The CLI reads this file so hook-triggered sound playback reflects the user's VS Code settings. If env vars are set they take priority over `config.json`, which is documented explicitly so users aren't confused by VS Code settings appearing to have no effect.

### Hook Stdin Payload Formats

**Stop hook** receives JSON on stdin:
```json
{
  "session_id": "<uuid>",
  "transcript_path": "/Users/<user>/.claude/projects/<hash>/<session_id>.jsonl"
}
```
The CLI uses `transcript_path` directly. `session_id` is a fallback if `transcript_path` is absent (finds transcript via `~/.claude/projects/**/<session_id>.jsonl`).

**PermissionRequest hook** receives JSON on stdin:
```json
{
  "session_id": "<uuid>",
  "hook_event_name": "PermissionRequest",
  "tool_name": "<string>",
  "tool_input": {},
  "permission_suggestions": [
    { "type": "addRules", "rules": [...], "behavior": "allow", "destination": "localSettings" }
  ]
}
```
Sound plays only if `permission_suggestions` array is non-empty (indicating a real approval dialog, not an auto-approved call).

**Notification hook** receives JSON on stdin but the payload is not used — sound plays unconditionally.

## File Structure

```
agent-ping/
├── src/
│   ├── cli.ts          # CLI entry point (replaces ping.sh)
│   ├── extension.ts    # VS Code extension entry point
│   ├── ping.ts         # Core event orchestration
│   ├── player.ts       # Cross-platform audio (afplay / paplay / PowerShell)
│   ├── detector.ts     # Question detection — reads JSONL transcript, applies regex
│   └── config.ts       # Config resolution (env → ~/.agent-ping/config.json → defaults)
├── sounds/
│   ├── stop.wav        # Bundled default for Stop event
│   ├── notification.wav # Bundled default for Notification and Permission events
│   └── .gitkeep
├── hooks/
│   └── hooks.json      # Calls: npx --yes agent-ping@latest stop / notification / permission
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── docs/
├── dist/               # Compiled output (gitignored, published to npm)
├── package.json
├── tsconfig.json
└── README.md
```

`ping.sh` is deleted.

## VS Code Settings

Registered via `contributes.configuration` in `package.json`. Appear in VS Code's native settings UI.

| Setting | Type | Default | Description |
|---|---|---|---|
| `agentPing.enabled` | boolean | `true` | Enable/disable the extension entirely |
| `agentPing.useSingleSound` | boolean | `false` | Use one sound for all events |
| `agentPing.singleSound` | string | `""` | Path to sound for all events; falls back to `sounds/notification.wav` |
| `agentPing.stopSound` | string | `""` | Sound when Claude finishes a task; falls back to `sounds/stop.wav` |
| `agentPing.notificationSound` | string | `""` | Sound when Claude asks a question; falls back to `sounds/notification.wav` |
| `agentPing.permissionSound` | string | `""` | Sound when a permission prompt appears; falls back to `sounds/notification.wav` |
| `agentPing.questionDetection` | boolean | `true` | Enable smart question detection heuristic on Stop event |
| `agentPing.stopEnabled` | boolean | `true` | Enable/disable Stop sound individually |
| `agentPing.notificationEnabled` | boolean | `true` | Enable/disable Notification sound individually |
| `agentPing.permissionEnabled` | boolean | `true` | Enable/disable Permission sound individually |

### Setting Interactions

**`useSingleSound: true`:** `singleSound` path is used for all events. Per-event sound paths (`stopSound`, `notificationSound`, `permissionSound`) are ignored. Per-event enable flags (`stopEnabled`, `notificationEnabled`, `permissionEnabled`) still apply — if an event is disabled, no sound plays even with `useSingleSound` active.

**`enabled: false`:** CLI exits 0 silently. No sound plays for any event. Per-event flags are irrelevant.

**`agentPing.enabled` written to `~/.agent-ping/config.json`:** The CLI checks this flag first and exits 0 if false.

## Hooks

`hooks/hooks.json` updated to:

```json
{
  "hooks": {
    "Stop": [{ "hooks": [{ "type": "command", "command": "npx --yes agent-ping@latest stop" }] }],
    "Notification": [{ "hooks": [{ "type": "command", "command": "npx --yes agent-ping@latest notification" }] }],
    "PermissionRequest": [{ "hooks": [{ "type": "command", "command": "npx --yes agent-ping@latest permission" }] }]
  }
}
```

`--yes` skips the npx install prompt and uses the cached version after first run, keeping subsequent invocations fast.

## Core Modules

### `config.ts`
Resolves config from env vars → `~/.agent-ping/config.json` → bundled defaults. Exports a single `resolveConfig()` function returning a typed config object:

```typescript
interface Config {
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
```

Bundled default paths are resolved relative to the npm package root using `__dirname`.

### `player.ts`
Cross-platform sound playback via `child_process.spawn` (non-blocking):
- macOS: `afplay`
- Linux: `paplay` → `aplay` fallback
- Windows: PowerShell `Media.SoundPlayer`

### `detector.ts`
Reads session JSONL transcript at the path from stdin (or resolved via `session_id`). Iterates lines, parses JSON, extracts the last `assistant` message's text blocks. Applies regex heuristics to detect questions:
- `?` at end of message
- "would you like", "want me to", "do you want", "shall I", "let me know"

### `ping.ts`
Orchestrates events. Called with resolved `Config` and event type:

- **`stop`**: reads stdin for `session_id` / `transcript_path`. If `questionDetection` enabled and last assistant message matches question heuristic, plays notification sound; otherwise plays stop sound. Respects `stopEnabled`.
- **`notification`**: plays notification sound. Respects `notificationEnabled`.
- **`permission`**: reads stdin, checks `permission_suggestions` array. If non-empty, plays permission sound. Respects `permissionEnabled`.

All events exit 0 silently if `enabled: false`.

### `cli.ts`
Thin entry point: reads `process.argv[2]` for event type, calls `resolveConfig()`, passes to `ping.ts`.

### `extension.ts`
VS Code extension lifecycle:
- **`activate`**: reads VS Code settings, writes to `~/.agent-ping/config.json`, registers `onDidChangeConfiguration` listener
- **`deactivate`**: no-op
- **On settings change**: re-reads and re-writes `~/.agent-ping/config.json`

## Build & Publish

| Command | Purpose |
|---|---|
| `npm run build` | Compile `src/` → `dist/` via `tsc` |
| `npm run watch` | Incremental compilation during development |
| `npm publish` | Publish pre-compiled package to npm |
| `vsce package` | Bundle `.vsix` for local VS Code install |
| `vsce publish` | Publish to VS Code Marketplace (future) |

`.npmignore` excludes `src/`, `docs/`, `.claude-plugin/`. Publishes `dist/`, `sounds/`, `hooks/`, `package.json`, `README.md`.

### `package.json` entry points

- **`main`**: `dist/extension.js` — required by VS Code to locate the extension activation function
- **`bin`**: `{ "agent-ping": "dist/cli.js" }` — enables `npx agent-ping@latest`

These are independent fields and do not conflict. `main` is used by VS Code's extension host; `bin` is used by npm/npx for CLI invocation.

### npx latency

`npx --yes agent-ping@latest` downloads the package on first run only. Subsequent invocations use the npm cache and add negligible latency (~10ms). Users who prefer zero network dependency on every run can install globally: `npm install -g agent-ping`, then update hooks to call `agent-ping stop` directly.

## Install Story for End Users

1. Add to `~/.claude/settings.json`:
```json
{
  "extraKnownMarketplaces": {
    "agent-ping": {
      "source": { "source": "github", "repo": "<owner>/agent-ping" }
    }
  }
}
```
2. Run `/plugin install agent-ping@agent-ping` in Claude Code

Hooks are wired automatically. No build step. No manual config required.

## Backwards Compatibility

Env vars (`AGENT_PING_STOP_SOUND`, `AGENT_PING_NOTIFICATION_SOUND`, `AGENT_PING_SOUND`) continue to work and take highest priority. Existing terminal users need only update their hook commands from the `ping.sh` path to `npx --yes agent-ping@latest`.
