# Agent Ping

Plays a sound when Claude finishes responding, asks a question, or needs your permission — so you can step away and come back when needed. Works with Claude Code, Cursor, and Windsurf.

---

## Install

1. Download the latest `.vsix` file from [GitHub Releases](https://github.com/DavidWilsby/agent-ping/releases).

2. Open your terminal and run the command for your editor, replacing the filename with the one you downloaded:

   ```bash
   # VS Code
   code --install-extension agent-ping-1.0.3.vsix

   # Cursor
   cursor --install-extension agent-ping-1.0.3.vsix

   # Windsurf
   windsurf --install-extension agent-ping-1.0.3.vsix
   ```

3. Reload your editor. Sounds will play automatically from now on — no further setup needed.

The extension wires everything up for you, including adding the required hooks to your Claude settings file.

---

## Custom sounds

Add an `env` section to `~/.claude/settings.json` with the full path to your sound files (WAV, MP3, or AIFF):

```json
{
  "env": {
    "AGENT_PING_STOP_SOUND": "/Users/yourname/Sounds/done.wav",
    "AGENT_PING_NOTIFICATION_SOUND": "/Users/yourname/Sounds/ping.wav"
  }
}
```

- `AGENT_PING_STOP_SOUND` — plays when the agent finishes a task
- `AGENT_PING_NOTIFICATION_SOUND` — plays when the agent asks a question, sends a notification, or needs your permission
- `AGENT_PING_SOUND` — use this instead to play the same sound for everything

To adjust which events play sounds, search for `Agent Ping` in your editor settings (`Cmd + ,` on Mac).

---

## Platform notes

| Platform | How sound plays |
| -------- | --------------- |
| macOS    | `afplay` — built in, nothing extra needed |
| Windows  | PowerShell — built in, nothing extra needed |
| Linux    | Requires `paplay` (PulseAudio) or `aplay` |

---

## Troubleshooting

**No sound plays** — Check your system volume. If you set a custom sound path, make sure the file exists at that exact location and you used the full path (not `~/...`).

**Wrong sound plays** — If `AGENT_PING_SOUND` is set in your `env`, it overrides everything. Remove it or switch to the two specific variables.

**Test it** — Ask Claude "What is 2 + 2?" — you should hear the stop sound when it replies.
