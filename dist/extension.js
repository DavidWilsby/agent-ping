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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const config_1 = require("./config");
const player_1 = require("./player");
const notifier_1 = require("./notifier");
const hooks_1 = require("./hooks");
function installClaudeHooks(binDir) {
    const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
    let settings = {};
    try {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
    catch {
        // File missing or invalid — start fresh
    }
    const hooks = settings['hooks'] ?? {};
    let changed = false;
    for (const [event, cmdArg] of Object.entries(hooks_1.HOOK_EVENT_COMMANDS)) {
        const existing = hooks[event] ?? [];
        const command = (0, hooks_1.buildHookCommand)(cmdArg, binDir);
        const result = (0, hooks_1.applyHookEntry)(existing, command);
        if (result.changed) {
            hooks[event] = result.groups;
            changed = true;
        }
    }
    if (changed) {
        settings['hooks'] = hooks;
        fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    }
}
async function ensureGlobalInstall() {
    let binDir = (0, hooks_1.resolveGlobalBinDir)();
    if (binDir)
        return binDir;
    while (true) {
        const choice = await vscode.window.showWarningMessage('Agent Ping requires a global install. Run: npm i -g agent-ping-vscode', 'Retry');
        if (choice !== 'Retry')
            return null;
        binDir = (0, hooks_1.resolveGlobalBinDir)();
        if (binDir)
            return binDir;
    }
}
function readVSCodeConfig() {
    const cfg = vscode.workspace.getConfiguration('agentPing');
    return {
        enabled: cfg.get('enabled'),
        volume: cfg.get('volume'),
        notificationEnabled: cfg.get('notificationEnabled'),
        notificationSound: cfg.get('notificationSound') ?? '',
        idlePromptEnabled: cfg.get('idlePromptEnabled'),
        stopEnabled: cfg.get('stopEnabled'),
        stopSound: cfg.get('stopSound') ?? '',
        respectDnd: cfg.get('respectDnd'),
        alertMode: cfg.get('alertMode'),
    };
}
function writeConfigFile(config) {
    const dir = path.join(os.homedir(), '.agent-ping-vscode');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(config, null, 2), 'utf-8');
}
function registerChooseCommand(context, commandId, settingKey) {
    const disposable = vscode.commands.registerCommand(commandId, async () => {
        const result = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: { 'Sound files': ['wav', 'mp3', 'aiff', 'aif'] },
            title: 'Choose Sound File',
        });
        if (!result || result.length === 0)
            return;
        const cfg = vscode.workspace.getConfiguration('agentPing');
        try {
            await cfg.update(settingKey, result[0].fsPath, vscode.ConfigurationTarget.Global);
        }
        catch {
            vscode.window.showErrorMessage('Agent Ping: Could not save setting.');
        }
    });
    context.subscriptions.push(disposable);
}
function registerTestCommand(context, commandId, settingKey) {
    const disposable = vscode.commands.registerCommand(commandId, () => {
        const cfg = vscode.workspace.getConfiguration('agentPing');
        const rawValue = cfg.get(settingKey);
        const resolvedPath = (rawValue && rawValue.length > 0)
            ? rawValue
            : String(config_1.BUNDLED_DEFAULTS[settingKey]);
        if (!fs.existsSync(resolvedPath)) {
            vscode.window.showErrorMessage('Agent Ping: Could not play sound. Check that the file path is correct.');
            return;
        }
        try {
            const volume = cfg.get('volume') ?? 50;
            (0, player_1.play)(resolvedPath, volume);
        }
        catch {
            vscode.window.showErrorMessage('Agent Ping: Could not play sound.');
        }
    });
    context.subscriptions.push(disposable);
}
function registerResetCommand(context, commandId, settingKey) {
    const disposable = vscode.commands.registerCommand(commandId, async () => {
        const cfg = vscode.workspace.getConfiguration('agentPing');
        try {
            await cfg.update(settingKey, '', vscode.ConfigurationTarget.Global);
        }
        catch {
            vscode.window.showErrorMessage('Agent Ping: Could not reset setting.');
        }
    });
    context.subscriptions.push(disposable);
}
function createLockFile() {
    try {
        const dir = path.dirname(notifier_1.LOCK_PATH);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(notifier_1.LOCK_PATH, String(process.pid), 'utf-8');
    }
    catch {
        // Best-effort
    }
}
function removeLockFile() {
    try {
        fs.unlinkSync(notifier_1.LOCK_PATH);
    }
    catch {
        // Already gone or never created
    }
}
function watchEventFile(context) {
    const dir = path.dirname(notifier_1.EVENT_PATH);
    fs.mkdirSync(dir, { recursive: true });
    let debounce;
    const watcher = fs.watch(dir, (eventType, filename) => {
        if (filename !== path.basename(notifier_1.EVENT_PATH))
            return;
        if (debounce)
            clearTimeout(debounce);
        debounce = setTimeout(() => {
            try {
                const content = fs.readFileSync(notifier_1.EVENT_PATH, 'utf-8');
                fs.unlinkSync(notifier_1.EVENT_PATH);
                const event = JSON.parse(content);
                vscode.window.showInformationMessage(`${event.title}: ${event.message}`);
            }
            catch {
                // File already consumed or invalid
            }
        }, 50);
    });
    context.subscriptions.push({ dispose: () => watcher.close() });
}
async function activate(context) {
    const binDir = await ensureGlobalInstall();
    if (binDir) {
        installClaudeHooks(binDir);
    }
    writeConfigFile(readVSCodeConfig());
    createLockFile();
    watchEventFile(context);
    const disposable = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('agentPing')) {
            writeConfigFile(readVSCodeConfig());
        }
    });
    context.subscriptions.push(disposable);
    registerChooseCommand(context, 'agentPing.chooseStopSound', 'stopSound');
    registerChooseCommand(context, 'agentPing.chooseNotificationSound', 'notificationSound');
    registerTestCommand(context, 'agentPing.testStopSound', 'stopSound');
    registerTestCommand(context, 'agentPing.testNotificationSound', 'notificationSound');
    registerResetCommand(context, 'agentPing.resetStopSound', 'stopSound');
    registerResetCommand(context, 'agentPing.resetNotificationSound', 'notificationSound');
    context.subscriptions.push(vscode.commands.registerCommand('agentPing.resetVolume', async () => {
        const cfg = vscode.workspace.getConfiguration('agentPing');
        try {
            await cfg.update('volume', undefined, vscode.ConfigurationTarget.Global);
        }
        catch {
            vscode.window.showErrorMessage('Agent Ping: Could not reset setting.');
        }
    }));
}
function deactivate() {
    removeLockFile();
}
