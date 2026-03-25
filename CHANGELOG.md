# Changelog

## [1.1.0] — 2026-03-25

### Changed
- Notification sound now only plays for actionable events (`permission_prompt`, `idle_prompt`, `elicitation_dialog`) — no longer pings on task completions and other non-actionable notifications

### Added
- **Idle Prompt** setting — toggle whether Claude waiting for input plays a sound (enabled by default)
- `agent-ping uninstall` command — removes hooks from `~/.claude/settings.json` and deletes `~/.agent-ping/` config
- `agent-ping --version` flag
- Uninstall section in README

---

## [1.0.x] — 2026-03-20 to 2026-03-24

Initial development. VS Code extension and CLI for playing sounds on Claude Code hook events. Cross-platform audio (macOS, Windows, Linux), auto-installation of Claude Code hooks, configurable sounds via settings panel or environment variables. Evolved through several iterations — simplifying from three sound events to two (Notification and Stop), switching from `npx` to a global binary for lower latency, and fixing stdin blocking and double-play issues.
