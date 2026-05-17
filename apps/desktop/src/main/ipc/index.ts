import { router } from "./trpc.js";
import { fileSystemRouter } from "./file-system-router.js";
import { settingsRouter } from "./settings-router.js";
import { gitRouter } from "./git-router.js";

export const appRouter = router({
  fileSystem: fileSystemRouter,
  settings: settingsRouter,
  git: gitRouter,
});

export type AppRouter = typeof appRouter;
