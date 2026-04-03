"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDndActive = isDndActive;
const child_process_1 = require("child_process");
/**
 * Returns true if macOS Do Not Disturb / Focus mode is currently active.
 * Always returns false on non-macOS platforms.
 *
 * Detection uses AppleScript to check whether a "Focus" menu bar item is
 * present in Control Center.  This works on macOS Monterey through Tahoe
 * (macOS 26+), unlike the `defaults` approach which broke in Sequoia.
 */
function isDndActive() {
    if (process.platform !== 'darwin')
        return false;
    try {
        const result = (0, child_process_1.execSync)(`osascript -e 'tell application "System Events" to tell its application process "ControlCenter"
set barItems to every menu bar item of menu bar 1
repeat with anItem in barItems
  try
    if description of anItem is "Focus" then return "true"
  end try
end repeat
return "false"
end tell'`, { encoding: 'utf-8', timeout: 3000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
        return result === 'true';
    }
    catch {
        return false;
    }
}
