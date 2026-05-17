import { z } from "zod";
import { publicProcedure, router } from "./trpc.js";
import type { TrpcContext } from "./trpc.js";
import { isGitRepo } from "@procode/utils";

const withWorkspace = (ctx: TrpcContext): string => {
  if (!ctx.workspaceRoot) {
    throw new Error("No workspace open");
  }
  return ctx.workspaceRoot;
};

const withGit = (ctx: TrpcContext): string => {
  const root = withWorkspace(ctx);
  if (!isGitRepo(root)) {
    throw new Error("No git repository found in current workspace");
  }
  return root;
};

const withNativeGit = (ctx: TrpcContext) => {
  const root = withGit(ctx);
  const native = (globalThis as any).procodeNative;
  if (!native?.gitStatus) {
    throw new Error("Git native bindings not available");
  }
  return { root, native };
};

export const gitRouter = router({
  status: publicProcedure.query(async ({ ctx }) => {
    const { root, native } = withNativeGit(ctx);
    const result = native.gitStatus(root);
    return JSON.parse(result);
  }),

  stage: publicProcedure
    .input(z.object({ paths: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      native.gitStage(root, input.paths);
    }),

  unstage: publicProcedure
    .input(z.object({ paths: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      native.gitUnstage(root, input.paths);
    }),

  discard: publicProcedure
    .input(z.object({ paths: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      native.gitDiscard(root, input.paths);
    }),

  diff: publicProcedure
    .input(z.object({ path: z.string(), staged: z.boolean() }))
    .query(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      const result = input.staged
        ? native.gitDiffStaged(root, input.path)
        : native.gitDiffUnstaged(root, input.path);
      return JSON.parse(result);
    }),

  commit: publicProcedure
    .input(z.object({ message: z.string().min(1), signOff: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      return native.gitCommit(root, input.message, input.signOff ?? false);
    }),

  amend: publicProcedure
    .input(z.object({ message: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      return native.gitAmend(root, input.message);
    }),

  branches: publicProcedure.query(async ({ ctx }) => {
    const { root, native } = withNativeGit(ctx);
    const result = native.gitBranchList(root);
    return JSON.parse(result);
  }),

  currentBranch: publicProcedure.query(async ({ ctx }) => {
    const { root, native } = withNativeGit(ctx);
    return native.gitBranchCurrent(root);
  }),

  createBranch: publicProcedure
    .input(z.object({ name: z.string(), from: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      native.gitBranchCreate(root, input.name, input.from);
    }),

  checkoutBranch: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      native.gitBranchCheckout(root, input.name);
    }),

  deleteBranch: publicProcedure
    .input(z.object({ name: z.string(), force: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      native.gitBranchDelete(root, input.name, input.force ?? false);
    }),

  blame: publicProcedure
    .input(z.object({ path: z.string() }))
    .query(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      const result = native.gitBlame(root, input.path);
      return JSON.parse(result);
    }),

  log: publicProcedure
    .input(z.object({ limit: z.number().optional(), path: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      const result = native.gitLog(root, input.limit ?? 50, input.path);
      return JSON.parse(result);
    }),

  fetch: publicProcedure
    .input(z.object({ remote: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      native.gitFetch(root, input.remote);
    }),

  pull: publicProcedure.mutation(async ({ ctx }) => {
      const { root, native } = withNativeGit(ctx);
      const result = native.gitPull(root);
      return JSON.parse(result);
    }),

  push: publicProcedure
    .input(z.object({ remote: z.string(), branch: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      native.gitPush(root, input.remote, input.branch);
    }),

  remotes: publicProcedure.query(async ({ ctx }) => {
    const { root, native } = withNativeGit(ctx);
    const result = native.gitRemoteList(root);
    return JSON.parse(result);
  }),

  stashPush: publicProcedure
    .input(z.object({ message: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      native.gitStashPush(root, input.message);
    }),

  stashPop: publicProcedure
    .input(z.object({ index: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      native.gitStashPop(root, input.index ?? 0);
    }),

  stashList: publicProcedure.query(async ({ ctx }) => {
    const { root, native } = withNativeGit(ctx);
    const result = native.gitStashList(root);
    return JSON.parse(result);
  }),

  stashDrop: publicProcedure
    .input(z.object({ index: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { root, native } = withNativeGit(ctx);
      native.gitStashDrop(root, input.index);
    }),

  isGitRepo: publicProcedure.query(async ({ ctx }) => {
    const root = withWorkspace(ctx);
    return isGitRepo(root);
  }),

  init: publicProcedure.mutation(async ({ ctx }) => {
    const root = withWorkspace(ctx);
    const { execSync } = require("child_process");
    execSync("git init", { cwd: root });
    return { success: true };
  }),
});
