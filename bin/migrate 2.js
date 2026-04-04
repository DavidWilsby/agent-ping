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
exports.migrateIfNeeded = migrateIfNeeded;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const config_1 = require("./config");
const LEGACY_CONFIG_DIR = path.join(os.homedir(), '.agent-ping-vscode');
const LEGACY_CONFIG_PATH = path.join(LEGACY_CONFIG_DIR, 'config.json');
const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
function getMarkerPath() {
    return path.join((0, config_1.getConfigDir)(), '.migrated');
}
function copyLegacyConfig() {
    try {
        if (!fs.existsSync(LEGACY_CONFIG_PATH))
            return;
        const content = fs.readFileSync(LEGACY_CONFIG_PATH, 'utf-8');
        const targetDir = (0, config_1.getConfigDir)();
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(path.join(targetDir, 'config.json'), content, 'utf-8');
    }
    catch {
        // Best-effort
    }
}
function removeLegacyHooks() {
    try {
        if (!fs.existsSync(CLAUDE_SETTINGS_PATH))
            return false;
        const content = fs.readFileSync(CLAUDE_SETTINGS_PATH, 'utf-8');
        const settings = JSON.parse(content);
        if (!settings.hooks)
            return false;
        let removed = false;
        for (const event of Object.keys(settings.hooks)) {
            const groups = settings.hooks[event];
            if (!Array.isArray(groups))
                continue;
            settings.hooks[event] = groups.filter((group) => {
                const hooks = group.hooks || [];
                return !hooks.some((h) => typeof h.command === 'string' && h.command.includes('agent-ping-vscode'));
            });
            if (settings.hooks[event].length < groups.length)
                removed = true;
        }
        if (removed) {
            fs.writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
        }
        return removed;
    }
    catch {
        return false;
    }
}
function migrateIfNeeded() {
    const markerPath = getMarkerPath();
    if (fs.existsSync(markerPath))
        return;
    copyLegacyConfig();
    const hooksRemoved = removeLegacyHooks();
    if (hooksRemoved) {
        console.log(`
Legacy Agent Ping hooks cleaned up. To avoid double pings, uninstall the old VS Code extension:
  - VS Code:   code --uninstall-extension dawi.agent-ping-vscode
  - Cursor:    cursor --uninstall-extension dawi.agent-ping-vscode
  - Windsurf:  windsurf --uninstall-extension dawi.agent-ping-vscode
`);
    }
    // Write marker so migration doesn't run again
    try {
        const targetDir = (0, config_1.getConfigDir)();
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(markerPath, new Date().toISOString(), 'utf-8');
    }
    catch {
        // Best-effort
    }
}
