import { z } from "zod";
import { router, publicProcedure } from "./trpc.js";

export const settingsRouter = router({
  getSettings: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.settings.getMergedSettings();
    }),

  updateSetting: publicProcedure
    .input(z.object({
      key: z.string(),
      value: z.unknown(),
      scope: z.enum(["global", "workspace"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.settings.updateSetting(input.key, input.value, input.scope);
    }),

  getGlobalSettings: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.settings.getGlobalSettings();
    }),

  getWorkspaceSettings: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.settings.getWorkspaceSettings();
    }),

  resetSettings: publicProcedure
    .input(z.object({ scope: z.enum(["global", "workspace"]).optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.settings.resetSettings(input.scope);
    }),
});
