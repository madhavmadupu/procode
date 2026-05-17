import { initTRPC } from "@trpc/server";
import type { FileSystemService } from "../services/file-system.js";
import type { SettingsService } from "../services/settings.js";
import type { LSPHost } from "@procode/lsp-host";
import type { DAPHost } from "@procode/dap-host";

export interface TrpcContext {
  fileSystem: FileSystemService;
  settings: SettingsService;
  workspaceRoot: string | null;
  lspHost: LSPHost | null;
  dapHost: DAPHost | null;
}

const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
