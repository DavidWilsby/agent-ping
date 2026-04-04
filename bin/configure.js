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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configure = configure;
const select_1 = __importDefault(require("@inquirer/select"));
const input_1 = __importDefault(require("@inquirer/input"));
const config_1 = require("./config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const CANCELLED = Symbol('cancelled');
async function cancellableSelect(opts) {
    const prompt = (0, select_1.default)(opts);
    const onKeypress = (_chunk, key) => {
        if (key?.name === 'escape')
            prompt.cancel();
    };
    process.stdin.on('keypress', onKeypress);
    try {
        return await prompt;
    }
    catch {
        return CANCELLED;
    }
    finally {
        process.stdin.removeListener('keypress', onKeypress);
    }
}
async function cancellableInput(opts) {
    const prompt = (0, input_1.default)(opts);
    const onKeypress = (_chunk, key) => {
        if (key?.name === 'escape')
            prompt.cancel();
    };
    process.stdin.on('keypress', onKeypress);
    try {
        return await prompt;
    }
    catch {
        return CANCELLED;
    }
    finally {
        process.stdin.removeListener('keypress', onKeypress);
    }
}
function saveConfig(config) {
    const configDir = (0, config_1.getConfigDir)();
    fs.mkdirSync(configDir, { recursive: true });
    const configPath = path.join(configDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}
function onOff(value) {
    return value ? 'on' : 'off';
}
function volumeBar(vol) {
    const filled = Math.round(vol / 5);
    return '█'.repeat(filled) + '░'.repeat(20 - filled);
}
function soundLabel(soundPath, bundledDefault) {
    return soundPath === bundledDefault ? 'bundled default' : soundPath;
}
async function configure() {
    const config = (0, config_1.resolveConfig)();
    let lastSetting;
    while (true) {
        console.clear();
        console.log('\n  Agent Ping Settings\n  ───────────────────\n');
        const setting = await cancellableSelect({
            message: 'Choose a setting to change (Esc to save and exit)',
            loop: false,
            pageSize: 9,
            default: lastSetting,
            choices: [
                { name: `Enabled             ${onOff(config.enabled)}`, value: 'enabled' },
                { name: `Alert Mode          ${config.alertMode}`, value: 'alertMode' },
                { name: `Respect DND         ${onOff(config.respectDnd)}`, value: 'respectDnd' },
                { name: `Volume              ${volumeBar(config.volume)} ${config.volume}%`, value: 'volume' },
                { name: `Notification Sound  ${onOff(config.notificationEnabled)}`, value: 'notificationEnabled' },
                { name: `Idle Prompt Sound   ${onOff(config.idlePromptEnabled)}`, value: 'idlePromptEnabled' },
                { name: `Stop Sound          ${onOff(config.stopEnabled)}`, value: 'stopEnabled' },
                { name: `Custom Sounds       ...`, value: 'customSounds' },
                { name: `Save and exit`, value: 'quit' },
            ],
        });
        if (setting === CANCELLED || setting === 'quit')
            break;
        lastSetting = setting;
        if (setting === 'customSounds') {
            console.clear();
            const soundChoice = await cancellableSelect({
                message: 'Custom sounds (Esc to go back)',
                loop: false,
                choices: [
                    { name: `Stop sound:         ${soundLabel(config.stopSound, config_1.BUNDLED_DEFAULTS.stopSound)}`, value: 'stop' },
                    { name: `Notification sound: ${soundLabel(config.notificationSound, config_1.BUNDLED_DEFAULTS.notificationSound)}`, value: 'notification' },
                    { name: 'Back', value: 'back' },
                ],
            });
            if (soundChoice !== CANCELLED && soundChoice !== 'back') {
                const action = await cancellableSelect({
                    message: `${soundChoice} sound`,
                    loop: false,
                    choices: [
                        { name: 'Enter file path', value: 'path' },
                        { name: 'Reset to bundled default', value: 'reset' },
                    ],
                });
                if (action === 'path') {
                    const filePath = await cancellableInput({
                        message: 'Path to sound file (WAV, MP3, or AIFF):',
                    });
                    if (filePath !== CANCELLED && filePath.trim()) {
                        if (soundChoice === 'stop')
                            config.stopSound = filePath.trim();
                        else
                            config.notificationSound = filePath.trim();
                    }
                }
                else if (action === 'reset') {
                    if (soundChoice === 'stop')
                        config.stopSound = config_1.BUNDLED_DEFAULTS.stopSound;
                    else
                        config.notificationSound = config_1.BUNDLED_DEFAULTS.notificationSound;
                }
            }
        }
        else if (setting === 'alertMode') {
            console.clear();
            const result = await cancellableSelect({
                message: 'Alert mode (Esc to go back)',
                loop: false,
                choices: [
                    { name: 'Sound only', value: 'sound' },
                    { name: 'Notification banner only', value: 'notification' },
                    { name: 'Sound and notification', value: 'both' },
                ],
                default: config.alertMode,
            });
            if (result !== CANCELLED)
                config.alertMode = result;
        }
        else if (setting === 'volume') {
            console.clear();
            const volumes = [];
            for (let v = 0; v <= 100; v += 5)
                volumes.push(v);
            const result = await cancellableSelect({
                message: 'Volume (Esc to go back)',
                loop: false,
                choices: volumes.map(v => ({
                    name: `${volumeBar(v)} ${String(v).padStart(3)}%`,
                    value: v,
                })),
                default: config.volume,
            });
            if (result !== CANCELLED)
                config.volume = result;
        }
        else {
            console.clear();
            const result = await cancellableSelect({
                message: `${setting} (Esc to go back)`,
                loop: false,
                choices: [
                    { name: 'On', value: true },
                    { name: 'Off', value: false },
                ],
                default: config[setting],
            });
            if (result !== CANCELLED)
                config[setting] = result;
        }
    }
    saveConfig({
        enabled: config.enabled,
        alertMode: config.alertMode,
        respectDnd: config.respectDnd,
        volume: config.volume,
        notificationEnabled: config.notificationEnabled,
        notificationSound: config.notificationSound === config_1.BUNDLED_DEFAULTS.notificationSound ? '' : config.notificationSound,
        idlePromptEnabled: config.idlePromptEnabled,
        stopEnabled: config.stopEnabled,
        stopSound: config.stopSound === config_1.BUNDLED_DEFAULTS.stopSound ? '' : config.stopSound,
    });
    console.clear();
    const configDir = (0, config_1.getConfigDir)();
    console.log(`\n  Settings saved to ${configDir}/config.json\n`);
}
