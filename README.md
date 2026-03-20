# Agent Ping

Plays a sound when Claude finishes responding. Works in Cursor, Windsurf, and any Claude Code environment.

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

## Custom sound

By default the plugin plays `sounds/ping.wav`. To use your own sound, add this to your `settings.json`:

```json
{
  "env": {
    "AGENT_PING_SOUND": "/path/to/your/sound.wav"
  }
}
```

Supported formats: `.wav`, `.mp3`, `.aiff` (macOS); `.wav` (Linux/Windows).

## Platform support

| Platform | Player  |
| -------- | ------- |
| macOS    | `afplay` (built-in) |
| Linux    | `paplay` or `aplay` |
| Windows  | PowerShell `Media.SoundPlayer` |
