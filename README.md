# Agent Ping

[![Version](https://img.shields.io/badge/version-2.1.1-blue)](https://github.com/DavidWilsby/agent-ping/releases) [![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**Platforms:** macOS · Linux · Windows

![Agent Ping banner](https://raw.githubusercontent.com/DavidWilsby/agent-ping/master/banner.png)

Sound alerts and OS notifications when Claude needs your attention — so you can step away and come back when needed. Works across Claude Code CLI and all editors (VS Code, Cursor, Windsurf, JetBrains).

- **Zero config** — install and it just works, sounds play automatically
- **Four events** — stop, notification, permission request, and error
- **Customizable** — choose sounds, set volume, toggle OS notification banners
- **Cross-platform** — macOS, Linux, and Windows support

---

## Quick start

```
/plugin marketplace add DavidWilsby/agent-ping
/plugin install agent-ping
```

Sounds will play automatically — no further setup needed. You don't need to clone this repo.

**Test it** — Ask Claude "What is 2 + 2?" — you should hear the stop sound when it replies.

To configure settings interactively:

```
/agent-ping:config
```

---

## Uninstall

```
/plugin uninstall agent-ping
```

---

## Settings

Run `/agent-ping:config` to open the interactive settings menu.

| Setting | Description | Default |
| ------- | ----------- | ------- |
| **Enabled** | Enable or disable Agent Ping entirely | On |
| **Alert Mode** | Play a sound, show an OS notification banner, or both | Sound |
| **Respect DND** | Suppress sounds when any macOS Focus mode is active (notification banners are managed by macOS). Requires macOS accessibility permissions on first use. | Off |
| **Volume** | Global volume for all sounds (0 = mute, 100 = full volume) | 50 |
| **Notification Enabled** | Enable or disable the Notification event sound | On |
| **Idle Prompt Enabled** | Play the notification sound when Claude is waiting for input | Off |
| **Stop Enabled** | Enable or disable the Stop event sound | On |
| **Custom Sounds** | Set custom sound file paths (WAV, MP3, AIFF) for stop and notification events | Bundled defaults |

---

## How it works

Agent Ping registers Claude Code hooks for four events:

| Event | When it fires |
| ----- | ------------- |
| **Stop** | Claude finishes responding |
| **Notification** | Claude sends a notification (filtered to actionable types only) |
| **PermissionRequest** | Claude needs your permission to proceed |
| **StopFailure** | Claude encounters an error and needs attention |

When a hook fires, Agent Ping plays a sound and/or shows an OS notification based on your alert mode setting.

---

## Platform notes

> **Note:** Agent Ping is developed and tested on macOS. Linux and Windows support is provided on a best-effort basis. Bug reports and pull requests are welcome.

| Platform | How sound plays | Volume control | Notification banners | Focus / DND |
| -------- | --------------- | -------------- | -------------------- | ----------- |
| macOS | `afplay` — built in | Supported | `terminal-notifier` (bundled) with app icon | Supported — sounds suppressed during any Focus mode; banners filtered by macOS |
| Windows | PowerShell — built in | Not supported — uses system volume | PowerShell toast | Not supported |
| Linux | `paplay` (PulseAudio) or `aplay` | `paplay` supported, `aplay` uses system volume | `notify-send` with app icon | Not supported |

---

## Migrating from the VS Code extension

If you previously used the Agent Ping VS Code extension (v1.4.x or earlier):

1. Install the plugin (see [Quick start](#quick-start) above)
2. The plugin automatically copies your settings and removes the old hooks on first run
3. Uninstall the old extension:
   - VS Code: `code --uninstall-extension dawi.agent-ping-vscode`
   - Cursor: `cursor --uninstall-extension dawi.agent-ping-vscode`
   - Windsurf: `windsurf --uninstall-extension dawi.agent-ping-vscode`
4. Optionally remove the global npm package: `npm uninstall -g agent-ping-vscode`

---

## Troubleshooting

**No sound plays** — Run `/agent-ping:config` and check that **Enabled** is on and the relevant event (Notification or Stop) is enabled. Check your system volume.

**Wrong sound plays** — Run `/agent-ping:config` and check the Custom Sounds submenu.

**Double banners or pings** — If you previously used the VS Code extension, it may reinstall its hooks alongside the plugin's. Uninstall the extension to fix this: `code --uninstall-extension dawi.agent-ping-vscode` (or `cursor` / `windsurf`).

**Plugin doesn't work in Claude Desktop app** — Hooks, MCP tools, and skills do not currently work in the Claude Desktop app's Code tab. This is a known platform limitation where the desktop app excludes plugin-scoped settings. See [#27398](https://github.com/anthropics/claude-code/issues/27398). The plugin works fully in the CLI and IDE extensions (VS Code, Cursor, Windsurf, JetBrains).

---

## Using the VS Code extension (legacy)

If you prefer the editor extension, it's still available on [Open VSX](https://open-vsx.org/extension/dawi/agent-ping-vscode) and works with VS Code, Cursor, and Windsurf. The extension is no longer actively developed but remains functional.

Extension users can override sounds and volume via environment variables in their shell profile (e.g. `~/.zshrc`):

```bash
export AGENT_PING_VOLUME=75
export AGENT_PING_STOP_SOUND=/path/to/sound.wav
export AGENT_PING_NOTIFICATION_SOUND=/path/to/sound.wav
```

---

## License

[MIT](LICENSE)
