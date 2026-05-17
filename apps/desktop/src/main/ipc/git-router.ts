import { z } from "zod";
import { publicProcedure, router } from "./trpc.js";
import type { TrpcContext } from "./trpc.js";

const withWorkspace = (ctx: TrpcContext) => {
  if (!ctx.workspaceRoot) {
    throw new Error("No workspace open");
  }
  return ctx.workspaceRoot;
};

export const gitRouter = router({
  status: publicProcedure.query(async ({ ctx }) => {
    const workspaceRoot = withWorkspace(ctx);
    const result = (globalThis as any).procodeNative.gitStatus(workspaceRoot);
    return JSON.parse(result);
  }),

  stage: publicProcedure
    .input(z.object({ paths: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      (globalThis as any).procodeNative.gitStage(workspaceRoot, input.paths);
    }),

  unstage: publicProcedure
    .input(z.object({ paths: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      (globalThis as any).procodeNative.gitUnstage(workspaceRoot, input.paths);
    }),

  discard: publicProcedure
    .input(z.object({ paths: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      (globalThis as any).procodeNative.gitDiscard(workspaceRoot, input.paths);
    }),

  diff: publicProcedure
    .input(z.object({ path: z.string(), staged: z.boolean() }))
    .query(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      const result = input.staged
        ? (globalThis as any).procodeNative.gitDiffStaged(workspaceRoot, input.path)
        : (globalThis as any).procodeNative.gitDiffUnstaged(workspaceRoot, input.path);
      return JSON.parse(result);
    }),

  commit: publicProcedure
    .input(z.object({ message: z.string().min(1), signOff: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      return (globalThis as any).procodeNative.gitCommit(
        workspaceRoot,
        input.message,
        input.signOff ?? false,
      );
    }),

  amend: publicProcedure
    .input(z.object({ message: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      return (globalThis as any).procodeNative.gitAmend(workspaceRoot, input.message);
    }),

  branches: publicProcedure.query(async ({ ctx }) => {
    const workspaceRoot = withWorkspace(ctx);
    const result = (globalThis as any).procodeNative.gitBranchList(workspaceRoot);
    return JSON.parse(result);
  }),

  currentBranch: publicProcedure.query(async ({ ctx }) => {
    const workspaceRoot = withWorkspace(ctx);
    return (globalThis as any).procodeNative.gitBranchCurrent(workspaceRoot);
  }),

  createBranch: publicProcedure
    .input(z.object({ name: z.string(), from: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      (globalThis as any).procodeNative.gitBranchCreate(workspaceRoot, input.name, input.from);
    }),

  checkoutBranch: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      (globalThis as any).procodeNative.gitBranchCheckout(workspaceRoot, input.name);
    }),

  deleteBranch: publicProcedure
    .input(z.object({ name: z.string(), force: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      (globalThis as any).procodeNative.gitBranchDelete(
        workspaceRoot,
        input.name,
        input.force ?? false,
      );
    }),

  blame: publicProcedure
    .input(z.object({ path: z.string() }))
    .query(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      const result = (globalThis as any).procodeNative.gitBlame(workspaceRoot, input.path);
      return JSON.parse(result);
    }),

  log: publicProcedure
    .input(z.object({ limit: z.number().optional(), path: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      const result = (globalThis as any).procodeNative.gitLog(
        workspaceRoot,
        input.limit ?? 50,
        input.path,
      );
      return JSON.parse(result);
    }),

  fetch: publicProcedure
    .input(z.object({ remote: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      (globalThis as any).procodeNative.gitFetch(workspaceRoot, input.remote);
    }),

  pull: publicProcedure.mutation(async ({ ctx }) => {
    const workspaceRoot = withWorkspace(ctx);
    const result = (globalThis as any).procodeNative.gitPull(workspaceRoot);
    return JSON.parse(result);
  }),

  push: publicProcedure
    .input(z.object({ remote: z.string(), branch: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      (globalThis as any).procodeNative.gitPush(workspaceRoot, input.remote, input.branch);
    }),

  remotes: publicProcedure.query(async ({ ctx }) => {
    const workspaceRoot = withWorkspace(ctx);
    const result = (globalThis as any).procodeNative.gitRemoteList(workspaceRoot);
    return JSON.parse(result);
  }),

  stashPush: publicProcedure
    .input(z.object({ message: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      (globalThis as any).procodeNative.gitStashPush(workspaceRoot, input.message);
    }),

  stashPop: publicProcedure
    .input(z.object({ index: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      (globalThis as any).procodeNative.gitStashPop(workspaceRoot, input.index ?? 0);
    }),

  stashList: publicProcedure.query(async ({ ctx }) => {
    const workspaceRoot = withWorkspace(ctx);
    const result = (globalThis as any).procodeNative.gitStashList(workspaceRoot);
    return JSON.parse(result);
  }),

  stashDrop: publicProcedure
    .input(z.object({ index: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceRoot = withWorkspace(ctx);
      (globalThis as any).procodeNative.gitStashDrop(workspaceRoot, input.index);
    }),
});
