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
    description: "Open the Agent Ping settings form",
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
      path: z.string().describe("Absolute path to a WAV, MP3, or AIFF file. Empty string to reset to bundled default."),
    }),
  },
  async (input) => {
    const current = readConfig();
    const key = input.event === "stop" ? "stopSound" : "notificationSound";
    const updated = { ...current, [key]: input.path };
    writeConfig(updated);

    const label = input.path || "bundled default";
    return {
      content: [{ type: "text" as const, text: `${input.event} sound set to: ${label}` }],
    };
  }
);

const transport = new StdioServerTransport();
mcpServer.connect(transport).catch(console.error);
