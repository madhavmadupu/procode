import { z } from "zod";
import { router, publicProcedure } from "./trpc.js";

export const workspaceRouter = router({
  getLastOpened: publicProcedure.query(async ({ ctx }) => {
    return ctx.db?.getLastOpened() ?? null;
  }),

  setLastOpened: publicProcedure
    .input(z.object({ rootPath: z.string(), name: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new Error("Database not initialized");
      }
      return ctx.db.upsertWorkspace(input.rootPath, input.name);
    }),

  clearLastOpened: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.db) {
      throw new Error("Database not initialized");
    }
    ctx.db.clearLastOpened();
  }),
});
