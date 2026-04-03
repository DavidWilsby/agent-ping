---
name: config
description: Configure agent-ping sound alerts and notification settings
disable-model-invocation: true
user-invocable: true
allowed-tools: Read,Write,Bash
---

Read the Agent Ping config file and show the user their current settings. Then ask what they'd like to change.

## Config file location

Determine the config path by checking the `CLAUDE_PLUGIN_DATA` environment variable. The config file is at `${CLAUDE_PLUGIN_DATA}/config.json`. If the env var is not set, fall back to `~/.agent-ping-vscode/config.json`.

If the file doesn't exist, all settings are at their defaults.

## Settings

| Setting | Key | Type | Default | Description |
|---------|-----|------|---------|-------------|
| Enabled | `enabled` | boolean | `true` | Master toggle |
| Alert Mode | `alertMode` | `"sound"`, `"notification"`, or `"both"` | `"sound"` | What happens when an event fires |
| Respect DND | `respectDnd` | boolean | `false` | Suppress sounds during macOS Focus modes |
| Volume | `volume` | number (0–100) | `50` | Sound volume |
| Stop Sound | `stopEnabled` | boolean | `true` | Play on task completion |
| Notification Sound | `notificationEnabled` | boolean | `true` | Play on permission/attention events |
| Idle Prompt Sound | `idlePromptEnabled` | boolean | `false` | Play when Claude is waiting for input |
| Stop Sound Path | `stopSound` | string | `""` | Custom sound file (empty = bundled default) |
| Notification Sound Path | `notificationSound` | string | `""` | Custom sound file (empty = bundled default) |

## How to handle changes

1. Read the current config file (or use defaults if it doesn't exist)
2. Show the user their current settings in a readable format
3. Ask what they'd like to change
4. When the user says what to change, update the relevant key(s) in the config
5. Write the updated config back to the file as formatted JSON
6. Confirm the change

You can handle multiple changes in one go. Volume must be clamped to 0–100. Alert mode must be one of: `sound`, `notification`, `both`.
