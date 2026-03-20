# Agent Ping

Plays a sound when Claude finishes responding. Works in Cursor, Windsurf, and any Claude Code environment.

Hooks fire automatically — no install required beyond the plugin. Sounds are configurable via VS Code settings or environment variables.

## Install

Add this to your `~/.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "agent-ping": {
      "source": {
        "source": "github",
        "repo": "YOUR_GITHUB_USERNAME/agent-ping"
      }
    }
  }
}
```

Then install via Claude Code:

```
/plugin install agent-ping@agent-ping
```

Hooks are wired automatically. No build step required — the plugin uses `npx --yes agent-ping@latest` which downloads and caches the package on first run.

**Optional:** Install globally to avoid any network dependency:

```bash
npm install -g agent-ping
```

Then update your hooks to use `agent-ping stop` / `agent-ping notification` / `agent-ping permission` directly.

## Events

| Event              | Trigger                                          | Sound used             |
| ------------------ | ------------------------------------------------ | ---------------------- |
| `Stop`             | Claude finishes a task (no question)             | `AGENT_PING_STOP_SOUND` |
| `Stop` (question)  | Claude's last message looks like a question      | `AGENT_PING_NOTIFICATION_SOUND` |
| `Notification`     | Claude sends a system notification               | `AGENT_PING_NOTIFICATION_SOUND` |
| `PermissionRequest`| A tool call needs your approval                  | `AGENT_PING_NOTIFICATION_SOUND` |

## Custom sounds

By default the plugin plays bundled sounds. Override with environment variables or VS Code settings.

### Environment variables (terminal / Claude Code CLI)

```json
{
  "env": {
    "AGENT_PING_STOP_SOUND": "/path/to/end-of-task.wav",
    "AGENT_PING_NOTIFICATION_SOUND": "/path/to/ping.wav"
  }
}
```

Use `AGENT_PING_SOUND` to set one sound for all events. Specific vars take priority.

### VS Code settings

Search for `Agent Ping` in VS Code settings. Full per-event control including enable/disable toggles and question detection.

## Platform support

| Platform | Player  |
| -------- | ------- |
| macOS    | `afplay` (built-in) |
| Linux    | `paplay` or `aplay` |
| Windows  | PowerShell `Media.SoundPlayer` |
