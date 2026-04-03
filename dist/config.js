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
exports.BUNDLED_DEFAULTS = void 0;
exports.resolveConfig = resolveConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const SOUNDS_DIR = path.join(__dirname, '..', 'sounds');
exports.BUNDLED_DEFAULTS = {
    enabled: true,
    notificationEnabled: true,
    notificationSound: path.join(SOUNDS_DIR, 'Ping.aiff'),
    idlePromptEnabled: false,
    stopEnabled: true,
    stopSound: path.join(SOUNDS_DIR, 'Done.aiff'),
    volume: 50,
    respectDnd: false,
    alertMode: 'sound',
};
function readConfigFile() {
    const configPath = path.join(os.homedir(), '.agent-ping-vscode', 'config.json');
    try {
        const content = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return {};
    }
}
function resolveConfig() {
    const fileConfig = readConfigFile();
    const base = { ...exports.BUNDLED_DEFAULTS, ...fileConfig };
    // Empty string sound paths mean "use bundled default"
    const soundKeys = ['notificationSound', 'stopSound'];
    for (const key of soundKeys) {
        if (base[key] === '')
            base[key] = exports.BUNDLED_DEFAULTS[key];
    }
    const envStop = process.env.AGENT_PING_STOP_SOUND;
    const envNotify = process.env.AGENT_PING_NOTIFICATION_SOUND;
    if (envStop)
        base.stopSound = envStop;
    if (envNotify)
        base.notificationSound = envNotify;
    const envVolume = process.env.AGENT_PING_VOLUME;
    if (envVolume !== undefined) {
        const parsed = parseInt(envVolume, 10);
        if (!isNaN(parsed))
            base.volume = parsed;
    }
    if (typeof base.volume !== 'number' || isNaN(base.volume)) {
        base.volume = exports.BUNDLED_DEFAULTS.volume;
    }
    base.volume = Math.max(0, Math.min(100, Math.round(base.volume)));
    const validModes = ['sound', 'notification', 'both'];
    if (!validModes.includes(base.alertMode)) {
        base.alertMode = exports.BUNDLED_DEFAULTS.alertMode;
    }
    return base;
}
