import { z } from "zod";
import { router, publicProcedure } from "./trpc.js";

export const fileSystemRouter = router({
  openFolder: publicProcedure
    .input(z.object({ path: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.fileSystem.openFolder(input.path);
    }),

  readDirectory: publicProcedure
    .input(z.object({ path: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.fileSystem.readDirectory(input.path);
    }),

  readFile: publicProcedure
    .input(z.object({ path: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.fileSystem.readFile(input.path);
    }),

  writeFile: publicProcedure
    .input(z.object({ path: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.fileSystem.writeFile(input.path, input.content);
    }),

  stat: publicProcedure
    .input(z.object({ path: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.fileSystem.stat(input.path);
    }),

  exists: publicProcedure
    .input(z.object({ path: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.fileSystem.exists(input.path);
    }),

  deleteFile: publicProcedure
    .input(z.object({ path: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.fileSystem.deleteFile(input.path);
    }),

  rename: publicProcedure
    .input(z.object({ oldPath: z.string(), newPath: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.fileSystem.rename(input.oldPath, input.newPath);
    }),

  getWorkspaceRoot: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.fileSystem.getWorkspaceRoot();
    }),

  createFile: publicProcedure
    .input(z.object({ dirPath: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.fileSystem.createFile(input.dirPath, input.name);
    }),

  createFolder: publicProcedure
    .input(z.object({ dirPath: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.fileSystem.createFolder(input.dirPath, input.name);
    }),

  deletePath: publicProcedure
    .input(z.object({ path: z.string(), recursive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.fileSystem.deletePath(input.path, input.recursive);
    }),

  move: publicProcedure
    .input(z.object({ sourcePath: z.string(), targetFolderPath: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.fileSystem.move(input.sourcePath, input.targetFolderPath);
    }),

  copyPath: publicProcedure
    .input(z.object({ path: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.fileSystem.copyPath(input.path);
    }),

  revealInFinder: publicProcedure
    .input(z.object({ path: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.fileSystem.revealInFinder(input.path);
    }),
});
