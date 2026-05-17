import { ipcMain } from "electron";
import type { TrpcContext } from "./trpc.js";
import type { FileSystemService } from "../services/file-system.js";
import type { SettingsService } from "../services/settings.js";
import { appRouter } from "./index.js";

const TRPC_CHANNEL = "trpc-request";

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
  fileSystem: FileSystemService,
  settings: SettingsService,
) {
  const ctx: TrpcContext = { fileSystem, settings };
  const caller = appRouter.createCaller(ctx);

  ipcMain.on(TRPC_CHANNEL, async (event, request: TrpcRequest) => {
    const responseChannel = `trpc-${request.id}`;

    try {
      const [routerName, procedureName] = request.path;

      let result: unknown;

      if (routerName === "fileSystem" && procedureName) {
        result = await (caller.fileSystem as any)[procedureName](request.input);
      } else if (routerName === "settings" && procedureName) {
        result = await (caller.settings as any)[procedureName](request.input);
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
