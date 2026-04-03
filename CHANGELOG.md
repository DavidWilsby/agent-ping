# Changelog

## [2.0.0] — 2026-04-03

### Changed
- **Repackaged as a Claude Code plugin** — works across CLI, desktop app, and all editors. Install with `/plugin install agent-ping`.
- Replaced `osascript` with bundled `terminal-notifier` on macOS for polished notification banners with app icon
- Replaced `@inquirer/prompts` with `@inquirer/select` and `@inquirer/input` (smaller dependency tree, resolves Socket security warnings)
- Config stored in plugin data directory instead of `~/.agent-ping-vscode/`

### Added
- Custom sound file paths in the interactive TUI (`/agent-ping config`)
- Automatic migration from VS Code extension — copies settings and removes legacy hooks on first run
- Self-hosted marketplace for direct installation from GitHub

### Removed
- VS Code extension code (deprecated in v1.5.0)
- `uninstall` CLI command (plugin system handles this)
- `--version` flag (version comes from plugin manifest)

---

## [1.4.1] — 2026-04-02

### Fixed
- Changelog was missing from the v1.4.0 published package — rebuilt with no other changes

---

## [1.4.0] — 2026-04-02

### Added
- **Alert mode** — new `agentPing.alertMode` setting to choose between `sound` (default), `notification` (banner only), or `both`.
- **Notification banners** — when the editor extension is running, banners appear as native VS Code/Cursor notifications. For CLI-only users, banners fall back to OS-native notifications via `osascript` (macOS), `notify-send` (Linux), or PowerShell toast (Windows).
- **Focus mode support** — opt-in sound suppression when any macOS Focus mode is active (Do Not Disturb, Work, etc.). Notification banners are always sent and filtered by macOS per your Focus mode settings. Enable via `agentPing.respectDnd` (off by default — requires macOS accessibility permissions). No effect on other platforms.
- **`agent-ping-vscode config`** — interactive TUI for CLI-only users to change settings from the terminal.
- Per-event notification messages (e.g. "Claude has finished the task", "Claude needs your permission to proceed")

---

## [1.3.0] — 2026-04-01

### Changed
- Renamed CLI binary from `agent-ping` to `agent-ping-vscode` for consistency across npm, Marketplace, and CLI
- Config directory changed from `~/.agent-ping/` to `~/.agent-ping-vscode/`

---

## [1.2.5] — 2026-04-01

### Changed
- Renamed package to `agent-ping-vscode` (Marketplace + npm) — Microsoft no longer allows reuse of deleted extension names
- Restructured README for Marketplace listing — install instructions, settings, and CLI-only usage
- CLI binary name remains `agent-ping` (unchanged)

### Fixed
- Extension icon now included in `.vsix` package
- Stale `permission_prompt` test from v1.2.3

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
