import { initTRPC } from "@trpc/server";
import type { FileSystemService } from "../services/file-system.js";
import type { SettingsService } from "../services/settings.js";

export interface TrpcContext {
  fileSystem: FileSystemService;
  settings: SettingsService;
  workspaceRoot: string | null;
}

const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
