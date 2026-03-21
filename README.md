# Agent Ping

Plays a sound when Claude finishes responding, asks a question, or needs your permission — so you can step away and come back when needed. Works with Claude Code, Cursor, and Windsurf. No Node.js required.

---

## Install

Open `~/.claude/settings.json` in a text editor.

- **macOS:** `/Users/yourname/.claude/settings.json`
- **Windows:** `C:\Users\yourname\.claude\settings.json`

If the file does not exist, create it. Add the `hooks` section below. If the file already has content, merge it in — don't replace what's there, just add the `"hooks"` block inside the outer `{ }`.

```json
{
  "hooks": {
    "Stop": [{ "hooks": [{ "type": "command", "command": "npx --yes agent-ping@latest stop" }] }],
    "Notification": [{ "hooks": [{ "type": "command", "command": "npx --yes agent-ping@latest notification" }] }],
    "PermissionRequest": [{ "hooks": [{ "type": "command", "command": "npx --yes agent-ping@latest permission" }] }]
  }
}
```

Save the file. Sounds will play automatically from now on. The first run downloads the package — after that it's cached.

---

## Custom sounds

Add an `env` section to the same `settings.json` file with the full path to your sound files (WAV, MP3, or AIFF):

```json
{
  "hooks": { ... },
  "env": {
    "AGENT_PING_STOP_SOUND": "/Users/yourname/Sounds/done.wav",
    "AGENT_PING_NOTIFICATION_SOUND": "/Users/yourname/Sounds/ping.wav"
  }
}
```

- `AGENT_PING_STOP_SOUND` — plays when the agent finishes a task
- `AGENT_PING_NOTIFICATION_SOUND` — plays when the agent asks a question, sends a notification, or needs your permission
- `AGENT_PING_SOUND` — use this instead to play the same sound for everything

---

## Optional — Settings panel in your editor

Download the latest `.vsix` from [GitHub Releases](https://github.com/DavidWilsby/agent-ping/releases) and install it for your editor. Replace the filename with the one you downloaded.

```bash
# VS Code
code --install-extension agent-ping-1.0.2.vsix

# Cursor
cursor --install-extension agent-ping-1.0.2.vsix

# Windsurf
windsurf --install-extension agent-ping-1.0.2.vsix
```

Then search for `Agent Ping` in your editor settings (`Cmd + ,` on Mac) to toggle sounds per event.

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
