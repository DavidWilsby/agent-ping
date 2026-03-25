# Agent Ping

Plays a sound when Claude finishes responding, asks a question, or needs your permission — so you can step away and come back when needed. Works with Claude Code, Cursor, and Windsurf.

---

## Settings

Open your editor settings (`Cmd+,` on Mac, `Ctrl+,` on Windows) and search for **Agent Ping**.

| Setting | Description | Default |
| ------- | ----------- | ------- |
| **Enabled** | Enable or disable Agent Ping entirely | On |
| **Volume** | Global volume for all sounds (0 = mute, 100 = full volume) | 50 |
| **Notification Enabled** | Enable or disable the Notification event sound | On |
| **Notification Sound** | Custom sound file for notifications (WAV, MP3, AIFF) | Bundled default |
| **Idle Prompt Enabled** | Play the notification sound when Claude is waiting for input | Off |
| **Stop Enabled** | Enable or disable the Stop event sound | On |
| **Stop Sound** | Custom sound file for the stop event (WAV, MP3, AIFF) | Bundled default |

---

## Install

> **Tip:** You can paste these instructions into ChatGPT, Claude, or any AI assistant and ask it to walk you through the installation step by step.

1. Download the latest `.vsix` file from [GitHub Releases](https://github.com/DavidWilsby/agent-ping/releases).

2. Open a terminal and navigate to the folder where you saved the `.vsix` file:

   ```bash
   cd path/to/folder
   ```

3. Install the extension in your editor:

   ```bash
   # VS Code
   code --install-extension agent-ping-1.2.1.vsix

   # Cursor
   cursor --install-extension agent-ping-1.2.1.vsix

   # Windsurf
   windsurf --install-extension agent-ping-1.2.1.vsix
   ```

4. Install the CLI so Claude's hooks can trigger sounds:

   ```bash
   npm i -g agent-ping
   ```

5. Reload your editor. Sounds will play automatically from now on — no further setup needed.

The extension manages your editor settings and sound preferences. The CLI is what Claude's hooks actually call to play sounds — it needs to be installed globally so the hooks can find it. If the CLI is missing, the extension will show a warning with a **Retry** button.

---

## Updating

1. Download the latest `.vsix` from [GitHub Releases](https://github.com/DavidWilsby/agent-ping/releases).
2. Run the same install command as above — it will replace the existing version automatically.
3. Reload your editor.

---

## Uninstall

1. Run the cleanup command to remove hooks and config:

   ```bash
   agent-ping uninstall
   ```

2. Remove the extension from your editor:

   ```bash
   # VS Code
   code --uninstall-extension dawi.agent-ping

   # Cursor
   cursor --uninstall-extension dawi.agent-ping

   # Windsurf
   windsurf --uninstall-extension dawi.agent-ping
   ```

3. Remove the global CLI:

   ```bash
   npm uninstall -g agent-ping
   ```

---

## Custom sounds

Each sound setting has a **Choose file…** link to pick a file, **Test sound** to preview, and **Reset to default** to go back to the bundled sound.

---

## Custom sounds without the extension

If you use the CLI without the VS Code extension (e.g., Claude Code in a terminal), you can set sound paths via environment variables in `~/.claude/settings.json`:

```json
{
  "env": {
    "AGENT_PING_STOP_SOUND": "/Users/yourname/Sounds/done.wav",
    "AGENT_PING_NOTIFICATION_SOUND": "/Users/yourname/Sounds/ping.wav",
    "AGENT_PING_VOLUME": "50"
  }
}
```

These override the extension's settings panel if both are present.

---

## Platform notes

| Platform | How sound plays | Volume control |
| -------- | --------------- | -------------- |
| macOS    | `afplay` — built in, nothing extra needed | Supported |
| Windows  | PowerShell — built in, nothing extra needed | Not supported — uses system volume |
| Linux    | Requires `paplay` (PulseAudio) or `aplay` | `paplay` supported, `aplay` uses system volume |

---

## Troubleshooting

**No sound plays** — Check your system volume. Open editor settings (`Cmd+,`) and search Agent Ping — make sure **Enabled** is on and the relevant event (Notification or Stop) is also enabled. If you set a custom sound path, make sure the file exists at that exact location.

**Wrong sound plays** — Open editor settings and search Agent Ping to review which sound is set for each event.

**Test it** — Ask Claude "What is 2 + 2?" — you should hear the stop sound when it replies.
