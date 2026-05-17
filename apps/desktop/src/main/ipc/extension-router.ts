import { initTRPC } from "@trpc/server";
import { z } from "zod";
import type { TrpcContext } from "./trpc.js";

const t = initTRPC.context<TrpcContext>().create();

const BUILTIN_EXTENSIONS = [
  {
    name: "procode-themes",
    displayName: "ProCode Default Themes",
    version: "1.0.0",
    description: "Built-in dark and light themes for ProCode",
    publisher: "procode",
    enabled: true,
  },
  {
    name: "wordcount",
    displayName: "Word Count",
    version: "1.0.0",
    description: "Shows word count in status bar for markdown files",
    publisher: "procode",
    enabled: true,
  },
  {
    name: "fileheader",
    displayName: "File Header",
    version: "1.0.0",
    description: "Inserts file header comments on save",
    publisher: "procode",
    enabled: true,
  },
];

export const extensionRouter = t.router({
  list: t.procedure.query(({ ctx }) => {
    const extensionHost = ctx.extensionHost;
    const registered = extensionHost
      ? extensionHost.getAllExtensions().map(ext => ({
          name: ext.manifest.name,
          displayName: ext.manifest.displayName,
          version: ext.manifest.version,
          description: ext.manifest.description,
          isActive: ext.isActive,
          publisher: "procode",
          enabled: true,
        }))
      : [];

    const registeredNames = new Set(registered.map(e => e.name));
    const builtins = BUILTIN_EXTENSIONS.filter(b => !registeredNames.has(b.name));

    return [...registered, ...builtins];
  }),

  activate: t.procedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const extensionHost = ctx.extensionHost;
      if (!extensionHost) {
        throw new Error("Extension Host not initialized");
      }
      const ext = extensionHost.getExtension(input.name);
      if (!ext) {
        throw new Error(`Extension '${input.name}' not found`);
      }
      console.log(`[ExtensionRouter] Activating ${input.name}`);
      return { success: true };
    }),

  deactivate: t.procedure
    .input(z.object({ name: z.string() }))
    .mutation(({ input, ctx }) => {
      const extensionHost = ctx.extensionHost;
      if (!extensionHost) {
        throw new Error("Extension Host not initialized");
      }
      extensionHost.deactivateExtension(input.name);
      return { success: true };
    }),

  getCommands: t.procedure.query(({ ctx }) => {
    const extensionHost = ctx.extensionHost;
    if (!extensionHost) {
      return [];
    }
    return extensionHost.getCommands();
  }),

  executeCommand: t.procedure
    .input(z.object({ id: z.string(), args: z.array(z.unknown()).optional() }))
    .mutation(async ({ input, ctx }) => {
      const extensionHost = ctx.extensionHost;
      if (!extensionHost) {
        throw new Error("Extension Host not initialized");
      }
      const result = await extensionHost.executeCommand(
        input.id,
        ...(input.args ?? [])
      );
      return { success: true, result };
    }),

  registerExtension: t.procedure
    .input(
      z.object({
        manifest: z.object({
          name: z.string(),
          displayName: z.string(),
          version: z.string(),
          description: z.string().optional(),
          main: z.string(),
          activationEvents: z.array(z.string()).optional(),
          contributes: z
            .object({
              commands: z
                .array(z.object({ command: z.string(), title: z.string() }))
                .optional(),
              languages: z
                .array(
                  z.object({
                    id: z.string(),
                    extensions: z.array(z.string()).optional(),
                  })
                )
                .optional(),
            })
            .optional(),
          dependencies: z.record(z.string()).optional(),
        }),
        extensionPath: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const extensionHost = ctx.extensionHost;
      if (!extensionHost) {
        throw new Error("Extension Host not initialized");
      }
      await extensionHost.registerExtension(
        input.manifest,
        input.extensionPath
      );
      return { success: true };
    }),
});
