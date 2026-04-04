# Agent Ping

![Agent Ping banner](https://raw.githubusercontent.com/DavidWilsby/agent-ping/master/banner.png)

Plays a sound when Claude finishes responding, asks a question, or needs your permission — so you can step away and come back when needed. Works with VS Code and any VS Code-based editor (Cursor, Windsurf, etc.).

> **⚠️ This extension is deprecated.** Agent Ping is now a [Claude Code plugin](https://github.com/DavidWilsby/agent-ping) that works across CLI, desktop app, and all editors — no extension needed. **[Migrate to the plugin →](#migrating-from-the-vs-code-extension)**

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

Sounds will play automatically after the next time Claude runs. To configure settings interactively, run:

```bash
agent-ping-vscode config
```

See [CLI-only configuration](#cli-only-configuration) for more options.

---

## Updating

Updates are automatic via the Marketplace. Reload your editor after updating.

To update the CLI, run `npm i -g agent-ping-vscode` again.

---

## Uninstall

1. Remove hooks and config:

   ```bash
   agent-ping-vscode uninstall
   ```

2. Remove the extension from the Extensions panel, or from the command line:

   ```bash
   <editor> --uninstall-extension dawi.agent-ping-vscode
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
| **Alert Mode** | Play a sound, show an OS notification banner, or both | Sound |
| **Respect DND** | Suppress sounds when any macOS Focus mode is active (notification banners are managed by macOS). Requires macOS accessibility permissions on first use. | Off |
| **Volume** | Global volume for all sounds (0 = mute, 100 = full volume) | 50 |
| **Notification Enabled** | Enable or disable the Notification event sound | On |
| **Notification Sound** | Custom sound file for notifications (WAV, MP3, AIFF) | Bundled default |
| **Idle Prompt Enabled** | Play the notification sound when Claude is waiting for input | Off |
| **Stop Enabled** | Enable or disable the Stop event sound | On |
| **Stop Sound** | Custom sound file for the stop event (WAV, MP3, AIFF) | Bundled default |

Each sound setting has a **Choose file...** link to pick a file, **Test sound** to preview, and **Reset to default** to go back to the bundled sound.

---

## CLI-only configuration

If you use the CLI without the editor extension, you can customize settings in `~/.agent-ping-vscode/config.json`:

```json
{
  "enabled": true,
  "alertMode": "sound",
  "respectDnd": false,
  "volume": 50,
  "notificationEnabled": true,
  "notificationSound": "",
  "idlePromptEnabled": false,
  "stopEnabled": true,
  "stopSound": ""
}
```

Leave sound paths empty to use the bundled defaults, or set an absolute path to a WAV, MP3, or AIFF file.

You can also override sounds and volume via environment variables in `~/.claude/settings.json`:

```json
{
  "env": {
    "AGENT_PING_STOP_SOUND": "/Users/yourname/Sounds/done.wav",
    "AGENT_PING_NOTIFICATION_SOUND": "/Users/yourname/Sounds/ping.wav",
    "AGENT_PING_VOLUME": "50"
  }
}
```

Environment variables take precedence over the config file. When the editor extension is running, it manages the config file — use the editor's settings panel instead.

---

## Platform notes

> **Note:** Agent Ping is developed and tested on macOS. Linux and Windows support is provided on a best-effort basis and has not been thoroughly tested. Bug reports and pull requests are welcome.

| Platform | How sound plays | Volume control | Notification banners | Focus / DND |
| -------- | --------------- | -------------- | -------------------- | ----------- |
| macOS    | `afplay` — built in, nothing extra needed | Supported | Native editor notification when extension is running; `osascript` fallback for CLI-only (attributed to Script Editor) | Supported — sounds suppressed during any Focus mode; banners filtered by macOS per your Focus settings |
| Windows  | PowerShell — built in, nothing extra needed | Not supported — uses system volume | Native editor notification when extension is running; PowerShell toast fallback for CLI-only | Not supported |
| Linux    | Requires `paplay` (PulseAudio) or `aplay` | `paplay` supported, `aplay` uses system volume | Native editor notification when extension is running; `notify-send` fallback for CLI-only (with app icon) | Not supported |

---

## Migrating from the VS Code extension

Agent Ping is now available as a Claude Code plugin with cross-platform support. To migrate:

1. Install the plugin:
   ```
   /plugin marketplace add DavidWilsby/agent-ping
   /plugin install agent-ping
   ```
2. The plugin automatically copies your settings and removes the old hooks on first run
3. Uninstall the old extension:
   - VS Code: `code --uninstall-extension dawi.agent-ping-vscode`
   - Cursor: `cursor --uninstall-extension dawi.agent-ping-vscode`
   - Windsurf: `windsurf --uninstall-extension dawi.agent-ping-vscode`
4. Optionally remove the global npm package: `npm uninstall -g agent-ping-vscode`

---

## Troubleshooting

**No sound plays** — Check your system volume. Open editor settings (`Cmd+,`) and search Agent Ping — make sure **Enabled** is on and the relevant event (Notification or Stop) is also enabled. If you set a custom sound path, make sure the file exists at that exact location.

**Wrong sound plays** — Open editor settings and search Agent Ping to review which sound is set for each event.

**Test it** — Ask Claude "What is 2 + 2?" — you should hear the stop sound when it replies.

## Security

This extension modifies `~/.claude/settings.json` to register Claude Code hooks — this is how it knows when to play sounds. The hooks call the `agent-ping-vscode` binary with event names (`stop`, `notification`). No data is sent externally. The extension also writes a lock file and event file to `~/.agent-ping-vscode/` for coordination between the editor and CLI.

Socket.dev flags this as medium risk because it sees settings.json modification and command execution. This is expected and necessary behavior for a Claude Code hook integration.
