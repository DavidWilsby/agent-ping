# Agent Ping

![Agent Ping banner](https://raw.githubusercontent.com/DavidWilsby/agent-ping/master/banner.png)

Plays a sound when Claude finishes responding, asks a question, or needs your permission — so you can step away and come back when needed. Works with VS Code and any VS Code-based editor (Cursor, Windsurf, etc.).

---

## Install

### Editor extension

1. Open the Extensions panel (`Cmd+Shift+X` / `Ctrl+Shift+X`) and search for **Agent Ping**, or install from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=dawi.agent-ping-vscode).

2. Install the CLI so Claude's hooks can trigger sounds:

   ```bash
   npm i -g agent-ping-vscode
   ```

3. Reload your editor. Sounds will play automatically — no further setup needed.

The extension manages your settings and sound preferences. The CLI is what actually plays the sounds when Claude triggers a hook — it needs to be installed globally so the hooks can find it. If the CLI is missing, the extension will show a warning with a **Retry** button.

### CLI only

If you use Claude Code in a terminal without an editor, you only need the CLI:

```bash
npm i -g agent-ping-vscode
```

Sounds will play automatically after the next time Claude runs. See [CLI-only configuration](#cli-only-configuration) for customization options.

---

## Updating

Updates are automatic via the Marketplace. Reload your editor after updating.

To update the CLI, run `npm i -g agent-ping-vscode` again.

---

## Uninstall

1. Remove hooks and config:

   ```bash
   agent-ping uninstall
   ```

2. Remove the extension from the Extensions panel, or from the command line:

   ```bash
   code --uninstall-extension dawi.agent-ping-vscode
   ```

3. Remove the CLI:

   ```bash
   npm uninstall -g agent-ping-vscode
   ```

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

Each sound setting has a **Choose file...** link to pick a file, **Test sound** to preview, and **Reset to default** to go back to the bundled sound.

---

## CLI-only configuration

If you use the CLI without the editor extension, you can customize sounds via environment variables in `~/.claude/settings.json`:

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
