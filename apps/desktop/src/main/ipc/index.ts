import { router } from "./trpc.js";
import { fileSystemRouter } from "./file-system-router.js";
import { settingsRouter } from "./settings-router.js";
import { gitRouter } from "./git-router.js";
import { aiRouter } from "./ai-router.js";
import { lspRouter } from "./lsp-router.js";
import { dapRouter } from "./dap-router.js";

export const appRouter = router({
  fileSystem: fileSystemRouter,
  settings: settingsRouter,
  git: gitRouter,
  ai: aiRouter,
  lsp: lspRouter,
  dap: dapRouter,
});

export type AppRouter = typeof appRouter;
