# Agent Ping

Plays a sound when Claude finishes responding, asks a question, or needs your permission — so you can step away and come back when needed. Works with Claude Code, Cursor, and Windsurf.

---

## Install

1. Download the latest `.vsix` file from [GitHub Releases](https://github.com/DavidWilsby/agent-ping/releases).

2. Open your terminal, navigate to the folder where you downloaded the file, and run the command for your editor, replacing `agent-ping-x.x.x.vsix` with the filename you downloaded:

   ```bash
   # VS Code
   code --install-extension agent-ping-x.x.x.vsix

   # Cursor
   cursor --install-extension agent-ping-x.x.x.vsix

   # Windsurf
   windsurf --install-extension agent-ping-x.x.x.vsix
   ```

3. Reload your editor. Sounds will play automatically from now on — no further setup needed.

The extension wires everything up for you, including adding the required hooks to your Claude settings file.

---

## Updating

1. Download the latest `.vsix` from [GitHub Releases](https://github.com/DavidWilsby/agent-ping/releases).
2. Run the same install command as above — it will replace the existing version automatically.
3. Reload your editor.

---

## Custom sounds

Open your editor settings (`Cmd+,` on Mac, `Ctrl+,` on Windows) and search for **Agent Ping**. Each sound event has a **Choose file…** link you can click to pick any WAV, MP3, or AIFF file from your computer.

- **Notification** — plays when Claude asks a question, needs your permission, or is waiting for input
- **Stop** — plays when Claude finishes a task

Use **Test sound** to preview, and **Reset to default** to go back to the bundled sound.

---

## Advanced: custom sounds via environment variables

If you prefer, you can set sound paths directly in `~/.claude/settings.json`:

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

Environment variables take priority over the settings panel.

---

## Platform notes

| Platform | How sound plays |
| -------- | --------------- |
| macOS    | `afplay` — built in, nothing extra needed |
| Windows  | PowerShell — built in, nothing extra needed |
| Linux    | Requires `paplay` (PulseAudio) or `aplay` |

---

## Troubleshooting

**No sound plays** — Check your system volume. Open editor settings (`Cmd+,`) and search Agent Ping — make sure **Enabled** is on and the relevant event (Notification or Stop) is also enabled. If you set a custom sound path, make sure the file exists at that exact location.

**Wrong sound plays** — Open editor settings and search Agent Ping to review which sound is set for each event.

**Test it** — Ask Claude "What is 2 + 2?" — you should hear the stop sound when it replies.
