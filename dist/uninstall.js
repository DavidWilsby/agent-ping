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
exports.removeHooksAndConfig = removeHooksAndConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const hooks_1 = require("./hooks");
/**
 * Removes agent-ping-vscode hooks from ~/.claude/settings.json
 * and deletes the ~/.agent-ping-vscode config directory.
 */
function removeHooksAndConfig() {
    removeClaudeHooks();
    removeConfigDir();
    console.log('agent-ping-vscode uninstalled. You can now run: npm uninstall -g agent-ping-vscode-vscode');
}
function removeClaudeHooks() {
    const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
    let settings;
    try {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
    catch {
        return; // No settings file — nothing to clean up
    }
    const hooks = settings['hooks'];
    if (!hooks)
        return;
    let changed = false;
    for (const event of Object.keys(hooks_1.HOOK_EVENT_COMMANDS)) {
        const groups = hooks[event];
        if (!groups)
            continue;
        const filtered = groups.filter(group => !group.hooks?.some(h => h.command?.includes('agent-ping-vscode')));
        if (filtered.length !== groups.length) {
            changed = true;
            if (filtered.length === 0) {
                delete hooks[event];
            }
            else {
                hooks[event] = filtered;
            }
        }
    }
    if (changed) {
        settings['hooks'] = hooks;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
        console.log('Removed hooks from ~/.claude/settings.json');
    }
}
function removeConfigDir() {
    const configDir = path.join(os.homedir(), '.agent-ping-vscode');
    try {
        fs.rmSync(configDir, { recursive: true });
        console.log('Removed ~/.agent-ping-vscode/');
    }
    catch {
        // Directory doesn't exist — nothing to do
    }
}
