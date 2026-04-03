---
name: agent-ping config
description: Configure agent-ping sound alerts and notification settings
disable-model-invocation: true
user-invocable: true
allowed-tools: Bash
---

Run the Agent Ping configuration TUI:

```bash
node ${CLAUDE_SKILL_DIR}/../../bin/agent-ping config
```

This opens an interactive menu where you can change:
- Enabled/disabled
- Alert mode (sound, notification, or both)
- Volume (0–100)
- DND/Focus mode respect (macOS)
- Per-event toggles (stop, notification, idle prompt)
- Custom sound file paths
