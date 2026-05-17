import { router } from "./trpc.js";
import { fileSystemRouter } from "./file-system-router.js";
import { settingsRouter } from "./settings-router.js";

export const appRouter = router({
  fileSystem: fileSystemRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
