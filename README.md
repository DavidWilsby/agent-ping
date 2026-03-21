# Agent Ping

Agent Ping plays a sound when your AI agent finishes working — so you can look away, do something else, and come back when it's done. It works with Claude Code, Cursor, and Windsurf.

Once installed, it runs automatically in the background. You do not need to configure anything to get started.

---

## What it does

When you ask Claude (or another AI agent) to complete a task, Agent Ping listens for specific moments and plays a short sound:

- When the agent finishes and is waiting for your next message
- When the agent asks you a question
- When the agent needs your permission to use a tool

Think of it like a kitchen timer — you can step away and trust you will hear when something needs your attention.

---

## Before you install

You do not need to install Node.js or any other software. Agent Ping handles everything itself.

You will need:

- **Claude Code** installed and working (the CLI tool you type commands into)
- A text editor to edit one configuration file

---

## Step 1 — Edit your Claude settings file

Claude Code uses a settings file stored in a hidden folder in your home directory. You need to add a few lines to this file before you can install the plugin.

**Where to find the file:**

- On macOS: `/Users/yourname/.claude/settings.json` (replace `yourname` with your actual username)
- On Windows: `C:\Users\yourname\.claude\settings.json`

The folder is hidden by default. On macOS, you can open it in Finder by pressing `Cmd + Shift + G` in any Finder window and pasting the path. On Windows, paste the path directly into the address bar in File Explorer.

**Open the file in any text editor** (TextEdit on Mac, Notepad on Windows, or your code editor).

**If the file does not exist yet**, create it as a new empty file at that location.

---

## Step 2 — Add the marketplace entry

The file contains JSON — a structured format that looks like nested curly braces `{ }`. You need to add an `extraKnownMarketplaces` section.

**If the file is empty**, paste in exactly this:

```json
{
  "extraKnownMarketplaces": {
    "agent-ping": {
      "source": {
        "source": "github",
        "repo": "DavidWilsby/agent-ping"
      }
    }
  }
}
```

**If the file already has content**, you need to add the `extraKnownMarketplaces` block inside the existing outer `{ }` without duplicating the braces. For example, if your file currently looks like this:

```json
{
  "someOtherSetting": true
}
```

Change it to this:

```json
{
  "someOtherSetting": true,
  "extraKnownMarketplaces": {
    "agent-ping": {
      "source": {
        "source": "github",
        "repo": "DavidWilsby/agent-ping"
      }
    }
  }
}
```

Note the comma after `"someOtherSetting": true` — every entry except the last one needs a comma after it. Save the file when you are done.

---

## Step 3 — Install the plugin

Open Claude Code (the chat interface where you type messages to Claude). In the chat input, type the following command exactly as written and press Enter:

```
/plugin install agent-ping@agent-ping
```

Claude Code will download and install the plugin. This may take a moment on the first run.

That is it. Sounds will now play automatically whenever the agent finishes or needs your attention. No restart required.

---

## Using custom sounds

By default, Agent Ping plays its own built-in sounds. If you want to use your own sound files, you can tell it where to find them.

Supported formats: WAV, MP3, and AIFF.

Open the same `settings.json` file from Step 1. Add an `env` section with the paths to your sound files. For example:

```json
{
  "extraKnownMarketplaces": {
    "agent-ping": {
      "source": {
        "source": "github",
        "repo": "DavidWilsby/agent-ping"
      }
    }
  },
  "env": {
    "AGENT_PING_STOP_SOUND": "/Users/yourname/Sounds/done.wav",
    "AGENT_PING_NOTIFICATION_SOUND": "/Users/yourname/Sounds/ping.wav"
  }
}
```

Replace the file paths with the actual locations of your sound files. Use the full path, not a shortcut like `~/Sounds/done.wav`.

**Two variables are available:**

- `AGENT_PING_STOP_SOUND` — plays when the agent finishes a task
- `AGENT_PING_NOTIFICATION_SOUND` — plays when the agent asks a question, sends a notification, or needs your permission

If you want the same sound for everything, use `AGENT_PING_SOUND` instead of the two separate variables.

---

## Optional — Settings panel in your editor

If you prefer a visual interface for toggling sounds on or off per event, you can install the VS Code extension version of Agent Ping.

**Download the file:**

Go to [github.com/DavidWilsby/agent-ping/releases](https://github.com/DavidWilsby/agent-ping/releases) and download the latest `.vsix` file. It will have a name like `agent-ping-1.0.2.vsix`.

**Install it from the terminal:**

Open your terminal and run the command for your editor, replacing `agent-ping-1.0.2.vsix` with the actual filename you downloaded:

For VS Code:
```
code --install-extension agent-ping-1.0.2.vsix
```

For Cursor:
```
cursor --install-extension agent-ping-1.0.2.vsix
```

For Windsurf:
```
windsurf --install-extension agent-ping-1.0.2.vsix
```

Once installed, search for `Agent Ping` in your editor's settings panel (usually found under File > Preferences > Settings or `Cmd + ,` on Mac) to see per-event controls.

This step is entirely optional. The plugin installed in Step 3 works on its own without this extension.

---

## Platform notes

| Platform | How sound plays |
| -------- | --------------- |
| macOS    | Uses `afplay`, which is built into macOS — nothing extra needed |
| Windows  | Uses PowerShell, which is built into Windows — nothing extra needed |
| Linux    | Requires `paplay` (PulseAudio) or `aplay` to be installed |

On Linux, if you are not sure whether these are installed, open a terminal and type `paplay --version`. If you see a version number, you are ready. If not, install PulseAudio through your system's package manager.

---

## Troubleshooting

**No sound plays at all**

First, check that your system volume is not muted or very low. Agent Ping uses your system's default audio output.

Next, confirm the plugin installed correctly. In Claude Code, type `/plugin list` and check that `agent-ping` appears in the output.

On Linux, check that `paplay` or `aplay` is installed (see Platform notes above).

If you set a custom sound path, double-check that the file exists at exactly that location and that the path in `settings.json` is the full path, not a shortcut.

**The wrong sound plays**

If a custom sound plays when you expected the default, check the `env` section of your `settings.json`. If `AGENT_PING_SOUND` is set, it overrides everything. Remove it or replace it with the two specific variables (`AGENT_PING_STOP_SOUND` and `AGENT_PING_NOTIFICATION_SOUND`) to control them separately.

**How to check that it is working**

Ask Claude to do a simple task — for example, "What is 2 + 2?" When Claude responds, you should hear the stop sound. If you do, everything is working.
