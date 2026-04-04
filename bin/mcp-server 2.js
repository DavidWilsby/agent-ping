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
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const DEFAULTS = {
    enabled: true,
    alertMode: "sound",
    respectDnd: false,
    volume: 50,
    stopEnabled: true,
    notificationEnabled: true,
    idlePromptEnabled: false,
    stopSound: "",
    notificationSound: "",
};
function getConfigDir() {
    const envVal = process.env.CLAUDE_PLUGIN_DATA;
    // Guard against unresolved ${...} substitution variables
    if (envVal && !envVal.includes("${"))
        return envVal;
    return path.join(os.homedir(), ".agent-ping-vscode");
}
function getConfigPath() {
    return path.join(getConfigDir(), "config.json");
}
function readConfig() {
    try {
        const content = fs.readFileSync(getConfigPath(), "utf-8");
        return { ...DEFAULTS, ...JSON.parse(content) };
    }
    catch {
        return { ...DEFAULTS };
    }
}
function writeConfig(config) {
    const dir = getConfigDir();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), "utf-8");
}
const mcpServer = new mcp_js_1.McpServer({
    name: "agent-ping",
    version: "2.0.0",
});
mcpServer.registerTool("configure", {
    description: "Open the Agent Ping settings form",
    inputSchema: {},
}, async () => {
    const current = readConfig();
    const result = await mcpServer.server.elicitInput({
        mode: "form",
        message: "Agent Ping Settings",
        requestedSchema: {
            type: "object",
            properties: {
                enabled: {
                    type: "boolean",
                    title: "Enabled",
                    description: "Enable or disable Agent Ping entirely",
                    default: current.enabled,
                },
                alertMode: {
                    type: "string",
                    title: "Alert Mode",
                    description: "What happens when Claude needs your attention",
                    oneOf: [
                        { const: "sound", title: "Sound only" },
                        { const: "notification", title: "Notification banner only" },
                        { const: "both", title: "Sound and notification" },
                    ],
                    default: current.alertMode,
                },
                volume: {
                    type: "integer",
                    title: "Volume",
                    description: "Sound volume (0 = mute, 100 = full)",
                    minimum: 0,
                    maximum: 100,
                    default: current.volume,
                },
                respectDnd: {
                    type: "boolean",
                    title: "Respect DND",
                    description: "Suppress sounds during macOS Focus modes",
                    default: current.respectDnd,
                },
                stopEnabled: {
                    type: "boolean",
                    title: "Stop Sound",
                    description: "Play sound when Claude finishes a task",
                    default: current.stopEnabled,
                },
                notificationEnabled: {
                    type: "boolean",
                    title: "Notification Sound",
                    description: "Play sound on permission prompts and attention events",
                    default: current.notificationEnabled,
                },
                idlePromptEnabled: {
                    type: "boolean",
                    title: "Idle Prompt Sound",
                    description: "Play sound when Claude is waiting for input",
                    default: current.idlePromptEnabled,
                },
                stopSound: {
                    type: "string",
                    title: "Custom Stop Sound",
                    description: "Path to sound file (WAV, MP3, AIFF). Leave empty for bundled default.",
                    default: current.stopSound,
                },
                notificationSound: {
                    type: "string",
                    title: "Custom Notification Sound",
                    description: "Path to sound file (WAV, MP3, AIFF). Leave empty for bundled default.",
                    default: current.notificationSound,
                },
            },
        },
    });
    if (result.action === "accept" && result.content) {
        const updated = {
            enabled: result.content.enabled ?? current.enabled,
            alertMode: result.content.alertMode ?? current.alertMode,
            volume: Math.max(0, Math.min(100, result.content.volume ?? current.volume)),
            respectDnd: result.content.respectDnd ?? current.respectDnd,
            stopEnabled: result.content.stopEnabled ?? current.stopEnabled,
            notificationEnabled: result.content.notificationEnabled ?? current.notificationEnabled,
            idlePromptEnabled: result.content.idlePromptEnabled ?? current.idlePromptEnabled,
            stopSound: result.content.stopSound ?? current.stopSound,
            notificationSound: result.content.notificationSound ?? current.notificationSound,
        };
        writeConfig(updated);
        return {
            content: [{ type: "text", text: `Settings saved.` }],
        };
    }
    return {
        content: [{ type: "text", text: "Settings unchanged." }],
    };
});
mcpServer.registerTool("set_sound", {
    description: "Set a custom sound file for stop or notification events, or reset to bundled default",
    inputSchema: zod_1.z.object({
        event: zod_1.z.enum(["stop", "notification"]).describe("Which sound to change"),
        path: zod_1.z.string().describe("Absolute path to a WAV, MP3, or AIFF file. IMPORTANT: To reset to bundled default, pass an empty string — not the word 'default'."),
    }),
}, async (input) => {
    const current = readConfig();
    const key = input.event === "stop" ? "stopSound" : "notificationSound";
    const soundPath = input.path === "default" || input.path === "reset" || input.path === "bundled" ? "" : input.path;
    const updated = { ...current, [key]: soundPath };
    writeConfig(updated);
    const label = soundPath || "bundled default";
    return {
        content: [{ type: "text", text: `${input.event} sound set to: ${label}` }],
    };
});
const transport = new stdio_js_1.StdioServerTransport();
mcpServer.connect(transport).catch(console.error);
