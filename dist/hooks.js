"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOOK_EVENT_COMMANDS = void 0;
exports.resolveGlobalBinDir = resolveGlobalBinDir;
exports.buildHookCommand = buildHookCommand;
exports.applyHookEntry = applyHookEntry;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.HOOK_EVENT_COMMANDS = {
    Stop: 'stop',
    Notification: 'notification',
    // Standalone hook events — not covered by Notification
    StopFailure: 'notification',
    PermissionRequest: 'notification',
};
/**
 * Attempts to resolve the directory containing the globally installed
 * `agent-ping-vscode` binary using a two-step strategy:
 *  1. Shell detection via `which` (macOS/Linux) or `where` (Windows)
 *  2. npm prefix fallback — checks `$(npm config get prefix)/bin/` (macOS/Linux only)
 *
 * Returns the bin directory string if found, or null if not found.
 *
 * Note: nvm/asdf users typically fail Step 1 because those tools only add
 * binaries to PATH in interactive shell sessions. Step 2 handles them via
 * `npm config get prefix`, which reflects the active Node version's prefix.
 */
function resolveGlobalBinDir() {
    const isWindows = process.platform === 'win32';
    // Step 1 — shell detection
    try {
        const cmd = isWindows ? 'where agent-ping-vscode' : 'which agent-ping-vscode';
        const opts = { encoding: 'utf-8' };
        const result = (0, child_process_1.execSync)(cmd, opts).trim();
        const firstLine = result.split('\n')[0].trim();
        if (firstLine)
            return path.dirname(firstLine);
    }
    catch { /* fall through */ }
    // Step 2 — npm prefix fallback (macOS/Linux only)
    if (!isWindows) {
        try {
            const opts = { encoding: 'utf-8' };
            const prefix = (0, child_process_1.execSync)('npm config get prefix', opts).trim();
            const binPath = path.join(prefix, 'bin', 'agent-ping-vscode');
            if (fs.existsSync(binPath))
                return path.join(prefix, 'bin');
        }
        catch { /* fall through */ }
    }
    return null;
}
/**
 * Builds the hook command string for a given event command argument.
 *
 * macOS/Linux: `PATH="<binDir>:$PATH" agent-ping-vscode <cmdArg>`
 * Windows: `agent-ping-vscode <cmdArg>` (bare; PATH injection syntax differs)
 */
function buildHookCommand(cmdArg, binDir) {
    const isWindows = process.platform === 'win32';
    if (!isWindows && binDir) {
        return `PATH="${binDir}:$PATH" agent-ping-vscode ${cmdArg}`;
    }
    return `agent-ping-vscode ${cmdArg}`;
}
/**
 * Applies the three-branch merge logic for a single hook event's group array:
 *  1. New-style hook present (agent-ping-vscode, no npx) — no change
 *  2. Old-style hook present (agent-ping-vscode + npx) — replace the group in place
 *  3. Neither — append a new group
 *
 * Returns the updated groups array and whether a change was made.
 */
function applyHookEntry(existing, command) {
    const newStyleExists = existing.some(group => group.hooks?.some(h => h.command?.includes('agent-ping-vscode') && !h.command?.includes('npx')));
    if (newStyleExists)
        return { groups: existing, changed: false };
    const oldStyleIdx = existing.findIndex(group => group.hooks?.some(h => h.command?.includes('agent-ping-vscode') && h.command?.includes('npx')));
    const newGroup = { hooks: [{ type: 'command', command }] };
    if (oldStyleIdx !== -1) {
        const groups = [
            ...existing.slice(0, oldStyleIdx),
            newGroup,
            ...existing.slice(oldStyleIdx + 1),
        ];
        return { groups, changed: true };
    }
    return { groups: [...existing, newGroup], changed: true };
}
