# Changelog

## [1.0.12] — 2026-03-24

### Changed
- Simplified to two sounds: **Notification** and **Stop**
- Notification sound now plays only for actionable events (`permission_prompt`, `idle_prompt`, `elicitation_dialog`) and stop failures — not every notification
- Removed `PermissionRequest` hook (was causing permission sound to play twice); permissions are now handled via the `Notification` hook's `notification_type` field
- Added `StopFailure` hook to play notification sound on API errors (rate limits, billing issues)
- Removed detection logic and transcript reading — no longer reads Claude's messages to decide whether to play a sound
- Removed debounce (was a workaround for the now-fixed double-play bug)

### Removed
- Permission sound setting (merged into Notification sound)
- Question detection settings
- `PermissionRequest` hook (legacy hook cleaned up automatically on extension activate)

---

## [1.0.11] — 2026-03-24

### Added
- Smart notification filtering — plays only when Claude is asking a question or waiting for input
- Debounce to prevent duplicate sounds

---

## [1.0.10] — 2026-03-22

### Fixed
- Always play permission sound on `PermissionRequest` hook

---

## [1.0.8] — 2026-03-21

### Added
- Permission sound event and setting

---

## [1.0.7] — 2026-03-21

### Changed
- Renamed `questionDetection` to `stopQuestionDetection`
- Reordered settings

---

## [1.0.6] — 2026-03-21

### Fixed
- Question Detection setting position in settings panel

---

## [1.0.5] — 2026-03-21

### Changed
- Reordered settings: notification / permission / stop

---

## [1.0.3–1.0.4] — 2026-03-21

### Changed
- Publisher update
- README and install instruction improvements

---

## [1.0.2] — 2026-03-21

### Fixed
- Treat empty string sound paths as bundled defaults

---

## [1.0.1] — 2026-03-21

### Added
- `Done.aiff` and `Ping.aiff` as bundled default sounds
- macOS playback fix

---

## [1.0.0] — 2026-03-20

### Added
- Initial release
- VS Code extension entry point
- CLI entry point (`npx agent-ping`)
- Cross-platform audio player (macOS `afplay`, Windows PowerShell, Linux `paplay`/`aplay`)
- Claude Code hook auto-installation into `~/.claude/settings.json`
- Configurable sound paths via VS Code settings or environment variables
