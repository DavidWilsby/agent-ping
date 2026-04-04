import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

type AlertMode = "sound" | "notification" | "both";

interface Config {
  enabled: boolean;
  alertMode: AlertMode;
  respectDnd: boolean;
  volume: number;
  stopEnabled: boolean;
  notificationEnabled: boolean;
  idlePromptEnabled: boolean;
  stopSound: string;
  notificationSound: string;
}

const DEFAULTS: Config = {
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

function getConfigDir(): string {
  const envVal = process.env.CLAUDE_PLUGIN_DATA;
  // Guard against unresolved ${...} substitution variables
  if (envVal && !envVal.includes("${")) return envVal;
  return path.join(os.homedir(), ".agent-ping-vscode");
}

function getConfigPath(): string {
  return path.join(getConfigDir(), "config.json");
}

function readConfig(): Config {
  try {
    const content = fs.readFileSync(getConfigPath(), "utf-8");
    return { ...DEFAULTS, ...JSON.parse(content) };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeConfig(config: Partial<Config>): void {
  const dir = getConfigDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), "utf-8");
}

const mcpServer = new McpServer({
  name: "agent-ping",
  version: "2.0.0",
});

mcpServer.registerTool(
  "configure",
  {
    description: "Open the Agent Ping settings form. ONLY use when the user explicitly asks to see or open the settings, NOT when they ask to change a specific setting. For specific changes, use set_setting or set_sound instead.",
    inputSchema: {},
  },
  async () => {
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
      const updated: Partial<Config> = {
        enabled: result.content.enabled as boolean ?? current.enabled,
        alertMode: (result.content.alertMode as AlertMode) ?? current.alertMode,
        volume: Math.max(0, Math.min(100, (result.content.volume as number) ?? current.volume)),
        respectDnd: result.content.respectDnd as boolean ?? current.respectDnd,
        stopEnabled: result.content.stopEnabled as boolean ?? current.stopEnabled,
        notificationEnabled: result.content.notificationEnabled as boolean ?? current.notificationEnabled,
        idlePromptEnabled: result.content.idlePromptEnabled as boolean ?? current.idlePromptEnabled,
        stopSound: (result.content.stopSound as string) ?? current.stopSound,
        notificationSound: (result.content.notificationSound as string) ?? current.notificationSound,
      };

      writeConfig(updated);

      return {
        content: [{ type: "text" as const, text: `Settings saved.` }],
      };
    }

    return {
      content: [{ type: "text" as const, text: "Settings unchanged." }],
    };
  }
);

mcpServer.registerTool(
  "set_sound",
  {
    description: "Set a custom sound file for stop or notification events, or reset to bundled default",
    inputSchema: z.object({
      event: z.enum(["stop", "notification"]).describe("Which sound to change"),
      path: z.string().describe("Absolute path to a WAV, MP3, or AIFF file. IMPORTANT: To reset to bundled default, pass an empty string — not the word 'default'."),
    }),
  },
  async (input) => {
    const current = readConfig();
    const key = input.event === "stop" ? "stopSound" : "notificationSound";
    const soundPath = input.path === "default" || input.path === "reset" || input.path === "bundled" ? "" : input.path;
    const updated = { ...current, [key]: soundPath };
    writeConfig(updated);

    const label = soundPath || "bundled default";
    return {
      content: [{ type: "text" as const, text: `${input.event} sound set to: ${label}` }],
    };
  }
);

mcpServer.registerTool(
  "set_setting",
  {
    description: "Change an Agent Ping setting. Use for volume, alert mode, enabled, DND, or per-event toggles.",
    inputSchema: z.object({
      setting: z.enum(["enabled", "alertMode", "respectDnd", "volume", "stopEnabled", "notificationEnabled", "idlePromptEnabled"]).describe("Which setting to change"),
      value: z.string().describe("The new value. For booleans: 'true' or 'false'. For volume: '0' to '100'. For alertMode: 'sound', 'notification', or 'both'."),
    }),
  },
  async (input) => {
    const current = readConfig();

    let parsedValue: boolean | number | string;
    if (input.setting === "volume") {
      parsedValue = Math.max(0, Math.min(100, parseInt(input.value, 10) || 50));
    } else if (input.setting === "alertMode") {
      parsedValue = ["sound", "notification", "both"].includes(input.value) ? input.value : current.alertMode;
    } else {
      parsedValue = input.value === "true";
    }

    const updated = { ...current, [input.setting]: parsedValue };
    writeConfig(updated);

    return {
      content: [{ type: "text" as const, text: `${input.setting} set to: ${parsedValue}` }],
    };
  }
);

const transport = new StdioServerTransport();
mcpServer.connect(transport).catch(console.error);
