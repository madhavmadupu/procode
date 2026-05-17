import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { LSPHost, DEFAULT_LSP_CONFIGS, checkAllServers, installServer } from '@procode/lsp-host';
import type { TrpcContext } from './trpc.js';

const t = initTRPC.context<TrpcContext>().create();

export const lspRouter = t.router({
  // Server management
  startServer: t.procedure
    .input(z.object({
      serverId: z.string(),
      rootPath: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        throw new Error('LSP Host not initialized');
      }

      // Register default config if not already registered
      const config = lspHost.getConfig(input.serverId);
      if (!config) {
        const defaultConfig = DEFAULT_LSP_CONFIGS.find(c => c.serverId === input.serverId);
        if (defaultConfig) {
          lspHost.registerConfig(defaultConfig);
        } else {
          throw new Error(`No configuration found for server: ${input.serverId}`);
        }
      }

      await lspHost.startServer(input.serverId, input.rootPath);
      return { success: true, serverId: input.serverId };
    }),

  stopServer: t.procedure
    .input(z.object({ serverId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        throw new Error('LSP Host not initialized');
      }

      await lspHost.stopServer(input.serverId);
      return { success: true, serverId: input.serverId };
    }),

  stopAll: t.procedure
    .mutation(async ({ ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        throw new Error('LSP Host not initialized');
      }

      await lspHost.stopAll();
      return { success: true };
    }),

  getServerStates: t.procedure
    .query(({ ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        return { servers: [] };
      }

      const states = lspHost.getAllServerStates();
      return {
        servers: Array.from(states.entries()).map(([id, state]) => ({
          serverId: id,
          state,
        })),
      };
    }),

  // LSP operations
  completion: t.procedure
    .input(z.object({
      uri: z.string(),
      line: z.number(),
      character: z.number(),
      triggerKind: z.number().optional(),
      triggerCharacter: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        return { isIncomplete: false, items: [] };
      }

      return lspHost.completion({
        textDocument: { uri: input.uri },
        position: { line: input.line, character: input.character },
        context: input.triggerKind ? {
          triggerKind: input.triggerKind,
          triggerCharacter: input.triggerCharacter,
        } : undefined,
      });
    }),

  hover: t.procedure
    .input(z.object({
      uri: z.string(),
      line: z.number(),
      character: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        return null;
      }

      return lspHost.hover({
        textDocument: { uri: input.uri },
        position: { line: input.line, character: input.character },
      });
    }),

  definition: t.procedure
    .input(z.object({
      uri: z.string(),
      line: z.number(),
      character: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        return null;
      }

      return lspHost.definition({
        textDocument: { uri: input.uri },
        position: { line: input.line, character: input.character },
      });
    }),

  references: t.procedure
    .input(z.object({
      uri: z.string(),
      line: z.number(),
      character: z.number(),
      includeDeclaration: z.boolean().default(true),
    }))
    .query(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        return null;
      }

      return lspHost.references({
        textDocument: { uri: input.uri },
        position: { line: input.line, character: input.character },
        context: { includeDeclaration: input.includeDeclaration },
      });
    }),

  documentSymbols: t.procedure
    .input(z.object({ uri: z.string() }))
    .query(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        return null;
      }

      return lspHost.documentSymbols({
        textDocument: { uri: input.uri },
      });
    }),

  workspaceSymbols: t.procedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        return null;
      }

      return lspHost.workspaceSymbols({ query: input.query });
    }),

  rename: t.procedure
    .input(z.object({
      uri: z.string(),
      line: z.number(),
      character: z.number(),
      newName: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        return null;
      }

      return lspHost.rename({
        textDocument: { uri: input.uri },
        position: { line: input.line, character: input.character },
        newName: input.newName,
      });
    }),

  signatureHelp: t.procedure
    .input(z.object({
      uri: z.string(),
      line: z.number(),
      character: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        return null;
      }

      return lspHost.signatureHelp({
        textDocument: { uri: input.uri },
        position: { line: input.line, character: input.character },
      });
    }),

  codeAction: t.procedure
    .input(z.object({
      uri: z.string(),
      startLine: z.number(),
      startCharacter: z.number(),
      endLine: z.number(),
      endCharacter: z.number(),
      diagnostics: z.array(z.object({
        uri: z.string(),
        severity: z.number().optional(),
        message: z.string(),
        range: z.object({
          start: z.object({ line: z.number(), character: z.number() }),
          end: z.object({ line: z.number(), character: z.number() }),
        }),
        source: z.string().optional(),
        code: z.union([z.string(), z.number()]).optional(),
      })).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        return null;
      }

      return lspHost.codeAction({
        textDocument: { uri: input.uri },
        range: {
          start: { line: input.startLine, character: input.startCharacter },
          end: { line: input.endLine, character: input.endCharacter },
        },
        context: {
          diagnostics: input.diagnostics ?? [],
        },
      });
    }),

  formatting: t.procedure
    .input(z.object({
      uri: z.string(),
      tabSize: z.number().default(2),
      insertSpaces: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        return null;
      }

      return lspHost.formatting({
        textDocument: { uri: input.uri },
        options: {
          tabSize: input.tabSize,
          insertSpaces: input.insertSpaces,
        },
      });
    }),

  // Document lifecycle
  didOpen: t.procedure
    .input(z.object({
      uri: z.string(),
      languageId: z.string(),
      version: z.number(),
      text: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        return;
      }

      await lspHost.didOpen({
        textDocument: {
          uri: input.uri,
          languageId: input.languageId,
          version: input.version,
          text: input.text,
        },
      });
    }),

  didChange: t.procedure
    .input(z.object({
      uri: z.string(),
      version: z.number(),
      changes: z.array(z.object({
        range: z.object({
          start: z.object({ line: z.number(), character: z.number() }),
          end: z.object({ line: z.number(), character: z.number() }),
        }).optional(),
        text: z.string(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        return;
      }

      await lspHost.didChange({
        textDocument: { uri: input.uri, version: input.version },
        contentChanges: input.changes.map(c => ({
          range: c.range ? {
            start: c.range.start,
            end: c.range.end,
          } : undefined,
          text: c.text,
        })),
      });
    }),

  didClose: t.procedure
    .input(z.object({ uri: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        return;
      }

      await lspHost.didClose({
        textDocument: { uri: input.uri },
      });
    }),

  didSave: t.procedure
    .input(z.object({
      uri: z.string(),
      text: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const lspHost = ctx.lspHost;
      if (!lspHost) {
        return;
      }

      await lspHost.didSave({
        textDocument: { uri: input.uri },
        text: input.text,
      });
    }),

  // Language server installer
  checkServers: t.procedure
    .query(async () => {
      return checkAllServers();
    }),

  installServer: t.procedure
    .input(z.object({ serverId: z.string() }))
    .mutation(async ({ input }) => {
      return installServer(input.serverId);
    }),
});
