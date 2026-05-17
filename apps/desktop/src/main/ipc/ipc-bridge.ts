import { ipcMain, BrowserWindow } from "electron";
import type { TrpcContext } from "./trpc.js";
import type { FileSystemService } from "../services/file-system.js";
import type { SettingsService } from "../services/settings.js";
import type { LSPHost } from "@procode/lsp-host";
import type { DAPHost } from "@procode/dap-host";
import type { TerminalHost } from "@procode/terminal";
import type { ExtensionHost } from "@procode/extension-api";
import type { ProCodeDB } from "@procode/db";
import { appRouter } from "./index.js";

const TRPC_CHANNEL = "trpc-request";
const TERMINAL_EVENT_CHANNEL = "terminal-event";

interface TrpcRequest {
  id: number;
  path: string[];
  input: unknown;
  type: "query" | "mutation";
}

interface TrpcResponse {
  id: number;
  result: {
    data?: unknown;
    error?: { message: string; code: number; data?: unknown };
  };
}

export function registerTrpcIpcHandlers(
  mainWindow: BrowserWindow,
  fileSystem: FileSystemService,
  settings: SettingsService,
  lspHost: LSPHost,
  dapHost: DAPHost,
  terminalHost: TerminalHost,
  extensionHost: ExtensionHost,
  db: ProCodeDB,
) {
  const ctx: TrpcContext = {
    fileSystem,
    settings,
    workspaceRoot: fileSystem.getWorkspaceRoot(),
    lspHost,
    dapHost,
    terminalHost,
    extensionHost,
    db,
  };
  const caller = appRouter.createCaller(ctx);

  terminalHost.onEventAll((id, event) => {
    mainWindow.webContents.send(TERMINAL_EVENT_CHANNEL, { id, event });
  });

  ipcMain.on(TRPC_CHANNEL, async (event, request: TrpcRequest) => {
    const responseChannel = `trpc-${request.id}`;

    try {
      const [routerName, procedureName] = request.path;

      let result: unknown;

      if (routerName === "fileSystem" && procedureName) {
        result = await (caller.fileSystem as any)[procedureName](request.input);
      } else if (routerName === "settings" && procedureName) {
        result = await (caller.settings as any)[procedureName](request.input);
      } else if (routerName === "git" && procedureName) {
        result = await (caller.git as any)[procedureName](request.input);
      } else if (routerName === "ai" && procedureName) {
        result = await (caller.ai as any)[procedureName](request.input);
      } else if (routerName === "lsp" && procedureName) {
        result = await (caller.lsp as any)[procedureName](request.input);
      } else if (routerName === "dap" && procedureName) {
        result = await (caller.dap as any)[procedureName](request.input);
      } else if (routerName === "terminal" && procedureName) {
        result = await (caller.terminal as any)[procedureName](request.input);
      } else if (routerName === "extension" && procedureName) {
        result = await (caller.extension as any)[procedureName](request.input);
      } else if (routerName === "workspace" && procedureName) {
        result = await (caller.workspace as any)[procedureName](request.input);
      } else {
        throw new Error(`Unknown router: ${routerName}`);
      }

      const response: TrpcResponse = {
        id: request.id,
        result: { data: result },
      };

      event.sender.send(responseChannel, response);
    } catch (error) {
      const response: TrpcResponse = {
        id: request.id,
        result: {
          error: {
            message: error instanceof Error ? error.message : "Unknown error",
            code: -32603,
            data: { stack: error instanceof Error ? error.stack : undefined },
          },
        },
      };

      event.sender.send(responseChannel, response);
    }
  });
}
