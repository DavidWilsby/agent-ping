# Agent Ping — TypeScript Port Design

**Date:** 2026-03-20
**Status:** Approved

## Overview

Port Agent Ping from a bash script to TypeScript, delivering a compiled Node.js CLI (for Claude Code hooks) and a VS Code extension (for settings UI). The repo is published to npm so hooks use `npx agent-ping@latest` — zero build step for end users.

## Goals

- Replace `ping.sh` with a TypeScript/Node.js CLI that hooks call identically
- Expose full user control via VS Code's native settings UI
- Preserve backwards compatibility with env var config for terminal users
- Work in Claude Code CLI (terminal), Cursor, and Windsurf
- Simple install story: Claude Code plugin install wires everything automatically

## Architecture

### Option Chosen: TypeScript CLI + VS Code Extension Wrapper (Option A)

Core logic lives in shared TypeScript modules. Two entry points compile from the same source:

1. **`src/cli.ts`** — called by hooks via `npx agent-ping@latest <event>`
2. **`src/extension.ts`** — VS Code extension entry point, provides settings UI and writes config to disk

### Config Resolution Order

1. **Env vars** (`AGENT_PING_STOP_SOUND`, `AGENT_PING_NOTIFICATION_SOUND`, `AGENT_PING_SOUND`) — terminal users, fully backwards compatible
2. **`~/.agent-ping/config.json`** — written by the VS Code extension when settings change
3. **Bundled defaults** — sounds shipped in `sounds/` directory

### Hook → CLI Bridge

The VS Code extension writes settings to `~/.agent-ping/config.json` on change. The CLI reads this file so hook-triggered sound playback reflects the user's VS Code settings without any env var wiring.

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
├── sounds/             # Bundled default sounds (TBD — replacements for current .wav files)
├── hooks/
│   └── hooks.json      # Calls: npx agent-ping@latest stop / notification / permission
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
| `agentPing.singleSound` | string | `""` | Path to sound file for all events (fallback: bundled default) |
| `agentPing.stopSound` | string | `""` | Sound when Claude finishes a task (fallback: bundled default) |
| `agentPing.notificationSound` | string | `""` | Sound when Claude asks a question (fallback: bundled default) |
| `agentPing.permissionSound` | string | `""` | Sound when a permission prompt appears (fallback: bundled default) |
| `agentPing.questionDetection` | boolean | `true` | Enable smart question detection heuristic on Stop event |
| `agentPing.stopEnabled` | boolean | `true` | Enable/disable Stop sound individually |
| `agentPing.notificationEnabled` | boolean | `true` | Enable/disable Notification sound individually |
| `agentPing.permissionEnabled` | boolean | `true` | Enable/disable Permission sound individually |

When `useSingleSound` is true, `singleSound` overrides all per-event sound paths.

## Hooks

`hooks/hooks.json` updated to:

```json
{
  "hooks": {
    "Stop": [{ "hooks": [{ "type": "command", "command": "npx agent-ping@latest stop" }] }],
    "Notification": [{ "hooks": [{ "type": "command", "command": "npx agent-ping@latest notification" }] }],
    "PermissionRequest": [{ "hooks": [{ "type": "command", "command": "npx agent-ping@latest permission" }] }]
  }
}
```

## Core Modules

### `config.ts`
Resolves config from env vars → `~/.agent-ping/config.json` → bundled defaults. Exports a single `resolveConfig()` function returning a typed config object.

### `player.ts`
Cross-platform sound playback via `child_process.spawn`:
- macOS: `afplay`
- Linux: `paplay` → `aplay` fallback
- Windows: PowerShell `Media.SoundPlayer`

### `detector.ts`
Reads session JSONL transcript, extracts last assistant text block, applies regex heuristics to detect questions. Preserves existing patterns: `?` at end of message, "would you like", "want me to", "shall I", etc.

### `ping.ts`
Orchestrates events:
- `stop` — reads stdin for `session_id`, runs question detection, plays notification or stop sound accordingly
- `notification` — plays notification sound directly
- `permission` — reads stdin for `permission_suggestions`, plays notification sound if non-empty

### `cli.ts`
Thin entry point: reads `process.argv[2]` for event type, calls `ping.ts`.

### `extension.ts`
VS Code extension lifecycle:
- `activate`: registers settings change listener, writes initial config to `~/.agent-ping/config.json`
- `deactivate`: no-op
- On settings change: re-writes `~/.agent-ping/config.json`

## Build & Publish

| Command | Purpose |
|---|---|
| `npm run build` | Compile `src/` → `dist/` via `tsc` |
| `npm run watch` | Incremental compilation during development |
| `npm publish` | Publish pre-compiled package to npm |
| `vsce package` | Bundle `.vsix` for local VS Code install |
| `vsce publish` | Publish to VS Code Marketplace (future) |

`.npmignore` excludes `src/`, `docs/`, `.claude-plugin/`. Publishes `dist/`, `sounds/`, `hooks/`, `package.json`, `README.md`.

`package.json` `main` field: `dist/cli.js`
`package.json` `bin` field: `{ "agent-ping": "dist/cli.js" }` — enables `npx agent-ping@latest`

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

Env vars (`AGENT_PING_STOP_SOUND`, `AGENT_PING_NOTIFICATION_SOUND`, `AGENT_PING_SOUND`) continue to work as before. Existing terminal users need only update their hook commands from the `ping.sh` path to `npx agent-ping@latest`.
