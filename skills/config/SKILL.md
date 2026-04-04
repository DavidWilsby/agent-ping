---
name: config
description: Open the Agent Ping settings form. Use ONLY when the user explicitly asks to see or open settings, NOT when they ask to change a specific setting.
---

Call the `mcp__agent-ping__configure` tool to open the Agent Ping settings form. The form lets the user change all settings interactively.

IMPORTANT: If the user asks to change a specific setting (like "set volume to 100" or "turn off idle prompt"), do NOT open this form. Use `mcp__agent-ping__set_setting` or `mcp__agent-ping__set_sound` instead.
