import { initTRPC } from "@trpc/server";
import { z } from "zod";
import type { TrpcContext } from "./trpc.js";

const t = initTRPC.context<TrpcContext>().create();

export const terminalRouter = t.router({
  create: t.procedure
    .input(
      z.object({
        name: z.string().optional(),
        cwd: z.string().optional(),
        shell: z.string().optional(),
        rows: z.number().optional(),
        cols: z.number().optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      const terminalHost = ctx.terminalHost;
      if (!terminalHost) {
        throw new Error("Terminal Host not initialized");
      }

      const workspaceCwd = input.cwd ?? ctx.workspaceRoot ?? undefined;

      const info = terminalHost.createSession({
        name: input.name,
        cwd: workspaceCwd,
        shell: input.shell,
        rows: input.rows,
        cols: input.cols,
        env: {
          ...process.env,
          PROCODE: "1",
          PROCODE_WORKSPACE: workspaceCwd ?? "",
          TERM: "xterm-256color",
          COLORTERM: "truecolor",
        } as Record<string, string>,
      });
      return info;
    }),

  write: t.procedure
    .input(z.object({ id: z.string(), data: z.string() }))
    .mutation(({ input, ctx }) => {
      const terminalHost = ctx.terminalHost;
      if (!terminalHost) {
        throw new Error("Terminal Host not initialized");
      }
      terminalHost.write(input.id, input.data);
      return { success: true };
    }),

  resize: t.procedure
    .input(z.object({ id: z.string(), rows: z.number(), cols: z.number() }))
    .mutation(({ input, ctx }) => {
      const terminalHost = ctx.terminalHost;
      if (!terminalHost) {
        throw new Error("Terminal Host not initialized");
      }
      terminalHost.resize(input.id, input.rows, input.cols);
      return { success: true };
    }),

  kill: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => {
      const terminalHost = ctx.terminalHost;
      if (!terminalHost) {
        throw new Error("Terminal Host not initialized");
      }
      terminalHost.killSession(input.id);
      return { success: true };
    }),

  killAll: t.procedure.mutation(({ ctx }) => {
    const terminalHost = ctx.terminalHost;
    if (!terminalHost) {
      throw new Error("Terminal Host not initialized");
    }
    terminalHost.killAll();
    return { success: true };
  }),

  list: t.procedure.query(({ ctx }) => {
    const terminalHost = ctx.terminalHost;
    if (!terminalHost) {
      return [];
    }
    return terminalHost.getAllSessionInfo();
  }),

  rename: t.procedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(({ input, ctx }) => {
      const terminalHost = ctx.terminalHost;
      if (!terminalHost) {
        throw new Error("Terminal Host not initialized");
      }
      terminalHost.renameSession(input.id, input.name);
      return { success: true };
    }),
});
