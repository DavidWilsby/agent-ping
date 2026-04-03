---
name: config
description: Configure agent-ping sound alerts and notification settings
disable-model-invocation: true
user-invocable: true
---

Tell the user to run the following command directly in their terminal using the `!` prefix, which launches an interactive TUI:

```
! node ${CLAUDE_SKILL_DIR}/../../bin/agent-ping config
```

Explain that this opens an interactive menu where they can change:
- Enabled/disabled
- Alert mode (sound, notification, or both)
- Volume (0–100)
- DND/Focus mode respect (macOS)
- Per-event toggles (stop, notification, idle prompt)
- Custom sound file paths

The TUI requires keyboard interaction (arrow keys, enter, escape) so it must be run directly, not through Claude's Bash tool.
