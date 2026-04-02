# Changelog

## [Unreleased]

### Added
- **Do Not Disturb support** — sounds are automatically suppressed when macOS Focus / Do Not Disturb is active. Enabled by default; configurable via `agentPing.respectDnd` setting. No effect on other platforms.
- **OS notification banners** — optionally show native notification banners alongside or instead of sounds. Supports macOS (`osascript`), Linux (`notify-send` with app icon), and Windows (PowerShell toast). Disabled by default; enable via `agentPing.osNotificationsEnabled`.
- **Alert mode** — new `agentPing.alertMode` setting to choose between `sound`, `notification`, or `both` when OS notifications are enabled.
- Per-event notification messages (e.g. "Claude has finished the task", "Claude needs your permission to proceed")

---

## [1.2.3] — 2026-03-26

### Fixed
- Permission prompts no longer play twice — `permission_prompt` notification type removed from actionable set since the `PermissionRequest` hook already handles it

---

## [1.2.2] — 2026-03-25

### Fixed
- Notifications now always filter through actionable types — previously the unfiltered path could ping on subagent task completions and other non-interactive events
- `PermissionRequest` and `StopFailure` hook events are now recognised as actionable by the unified handler

### Changed
- Removed `--filtered` CLI flag — filtering is now the default and only behavior
- Removed `handleFilteredNotification` — merged into `handleEvent`
- Hook-level events (`PermissionRequest`, `StopFailure`) are checked first, then notification types (`permission_prompt`, `idle_prompt`, `elicitation_dialog`)

---

## [1.2.0] — 2026-03-25

### Added
- **Volume** setting — global volume control for all sounds (0–100, default 50). Supported on macOS (`afplay`) and Linux (`paplay`). Windows and `aplay` use system volume.
- `AGENT_PING_VOLUME` environment variable override for CLI-only users
- Settings table in README

### Changed
- **Idle Prompt** default changed from enabled to disabled
- Improved install instructions for non-technical users

---

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
