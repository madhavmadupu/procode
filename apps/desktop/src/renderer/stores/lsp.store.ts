import { create } from 'zustand';
import type { Diagnostic, HoverResult, DefinitionResult, SymbolInfo, WorkspaceSymbolResult, Completion, LspServerState } from '@procode/types';
import { trpcCall } from '../lib/trpc.js';

interface LspStore {
  // Server state
  servers: LspServerState[];
  isInitializing: boolean;

  // Diagnostics
  diagnostics: Map<string, Diagnostic[]>;

  // Hover
  hover: HoverResult | null;
  hoverPosition: { line: number; character: number } | null;

  // Completion
  completions: Completion[];
  completionPosition: { line: number; character: number } | null;
  isCompleting: boolean;

  // Symbol search
  workspaceSymbols: WorkspaceSymbolResult[];
  isSearchingSymbols: boolean;

  // Actions
  startServer: (serverId: string, rootPath: string) => Promise<void>;
  stopServer: (serverId: string) => Promise<void>;
  stopAllServers: () => Promise<void>;
  refreshServerStates: () => Promise<void>;

  documentDidOpen: (uri: string, languageId: string, version: number, text: string) => Promise<void>;
  documentDidChange: (uri: string, version: number, changes: { range?: { start: { line: number; character: number }; end: { line: number; character: number } }; text: string }[]) => Promise<void>;
  documentDidClose: (uri: string) => Promise<void>;
  documentDidSave: (uri: string, text?: string) => Promise<void>;

  getCompletions: (uri: string, line: number, character: number, triggerKind?: number, triggerCharacter?: string) => Promise<void>;
  getHover: (uri: string, line: number, character: number) => Promise<void>;
  getDefinition: (uri: string, line: number, character: number) => Promise<DefinitionResult | null>;
  getReferences: (uri: string, line: number, character: number, includeDeclaration?: boolean) => Promise<DefinitionResult[] | null>;
  getDocumentSymbols: (uri: string) => Promise<SymbolInfo[] | null>;
  searchWorkspaceSymbols: (query: string) => Promise<void>;
  rename: (uri: string, line: number, character: number, newName: string) => Promise<{ changes: { [uri: string]: { range: { start: { line: number; character: number }; end: { line: number; character: number } }; newText: string }[] } } | null>;
  getSignatureHelp: (uri: string, line: number, character: number) => Promise<{ signatures: { label: string; documentation?: string; parameters?: { label: string; documentation?: string }[] }[]; activeSignature?: number; activeParameter?: number } | null>;
  getCodeActions: (uri: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number, diagnostics?: Diagnostic[]) => Promise<{ title: string; kind?: string; edit?: { changes: { [uri: string]: { range: { start: { line: number; character: number }; end: { line: number; character: number } }; newText: string }[] } }; command?: { title: string; command: string; arguments?: unknown[] } }[] | null>;
  formatDocument: (uri: string, tabSize?: number, insertSpaces?: boolean) => Promise<{ range: { start: { line: number; character: number }; end: { line: number; character: number } }; newText: string }[] | null>;

  clearHover: () => void;
  clearCompletions: () => void;
  clearDiagnostics: (uri?: string) => void;
}

export const useLspStore = create<LspStore>((set, get) => ({
  // Initial state
  servers: [],
  isInitializing: false,
  diagnostics: new Map(),
  hover: null,
  hoverPosition: null,
  completions: [],
  completionPosition: null,
  isCompleting: false,
  workspaceSymbols: [],
  isSearchingSymbols: false,

  // Server actions
  startServer: async (serverId: string, rootPath: string) => {
    await trpcCall('lsp', 'startServer', { serverId, rootPath }, 'mutation');
    await get().refreshServerStates();
  },

  stopServer: async (serverId: string) => {
    await trpcCall('lsp', 'stopServer', { serverId }, 'mutation');
    await get().refreshServerStates();
  },

  stopAllServers: async () => {
    await trpcCall('lsp', 'stopAll', {}, 'mutation');
    set({ servers: [] });
  },

  refreshServerStates: async () => {
    const result = await trpcCall('lsp', 'getServerStates', {}, 'query');
    set({ servers: result.servers ?? [] });
  },

  // Document lifecycle
  documentDidOpen: async (uri: string, languageId: string, version: number, text: string) => {
    await trpcCall('lsp', 'didOpen', { uri, languageId, version, text }, 'mutation');
  },

  documentDidChange: async (uri: string, version: number, changes: { range?: { start: { line: number; character: number }; end: { line: number; character: number } }; text: string }[]) => {
    await trpcCall('lsp', 'didChange', { uri, version, changes }, 'mutation');
  },

  documentDidClose: async (uri: string) => {
    await trpcCall('lsp', 'didClose', { uri }, 'mutation');
  },

  documentDidSave: async (uri: string, text?: string) => {
    await trpcCall('lsp', 'didSave', { uri, text }, 'mutation');
  },

  // LSP operations
  getCompletions: async (uri: string, line: number, character: number, triggerKind?: number, triggerCharacter?: string) => {
    set({ isCompleting: true });
    const result = await trpcCall('lsp', 'completion', { uri, line, character, triggerKind, triggerCharacter }, 'query');
    set({
      completions: result.items?.map((item: any) => ({
        label: item.label,
        kind: item.kind ?? 1,
        detail: item.detail,
        documentation: typeof item.documentation === 'string' ? item.documentation : item.documentation?.value,
        insertText: item.insertText ?? item.label,
        range: item.textEdit ? { start: item.textEdit.range.start, end: item.textEdit.range.end } : undefined,
      })) ?? [],
      completionPosition: { line, character },
      isCompleting: false,
    });
  },

  getHover: async (uri: string, line: number, character: number) => {
    const result = await trpcCall('lsp', 'hover', { uri, line, character }, 'query');
    if (result) {
      const contents = result.contents;
      let content = '';
      if (typeof contents === 'string') {
        content = contents;
      } else if (Array.isArray(contents)) {
        content = contents.map(c => typeof c === 'string' ? c : c.value).join('\n');
      } else {
        content = contents.value;
      }

      set({
        hover: { contents: [content], range: result.range },
        hoverPosition: { line, character },
      });
    } else {
      set({ hover: null, hoverPosition: null });
    }
  },

  getDefinition: async (uri: string, line: number, character: number) => {
    const result = await trpcCall('lsp', 'definition', { uri, line, character }, 'query');
    if (result) {
      if (Array.isArray(result)) {
        return result.map((loc: any) => ({
          uri: loc.uri,
          range: loc.range,
        }));
      } else {
        return {
          uri: result.uri,
          range: result.range,
        };
      }
    }
    return null;
  },

  getReferences: async (uri: string, line: number, character: number, includeDeclaration = true) => {
    const result = await trpcCall('lsp', 'references', { uri, line, character, includeDeclaration }, 'query');
    if (result) {
      return result.map((loc: any) => ({
        uri: loc.uri,
        range: loc.range,
      }));
    }
    return null;
  },

  getDocumentSymbols: async (uri: string) => {
    const result = await trpcCall('lsp', 'documentSymbols', { uri }, 'query');
    if (result) {
      return result.map((symbol: any) => ({
        name: symbol.name,
        kind: symbol.kind,
        uri,
        range: symbol.range,
        selectionRange: symbol.selectionRange,
        children: symbol.children,
      }));
    }
    return null;
  },

  searchWorkspaceSymbols: async (query: string) => {
    set({ isSearchingSymbols: true });
    const result = await trpcCall('lsp', 'workspaceSymbols', { query }, 'query');
    if (result) {
      set({
        workspaceSymbols: result.map((symbol: any) => ({
          name: symbol.name,
          kind: symbol.kind,
          uri: symbol.location.uri,
          location: symbol.location.range,
        })),
        isSearchingSymbols: false,
      });
    } else {
      set({ workspaceSymbols: [], isSearchingSymbols: false });
    }
  },

  rename: async (uri: string, line: number, character: number, newName: string) => {
    const result = await trpcCall('lsp', 'rename', { uri, line, character, newName }, 'mutation');
    if (result?.changes) {
      return {
        changes: Object.fromEntries(
          Object.entries(result.changes).map(([uri, edits]) => [
            uri,
            (edits as any[]).map((edit: any) => ({
              range: edit.range,
              newText: edit.newText,
            })),
          ])
        ),
      };
    }
    return null;
  },

  getSignatureHelp: async (uri: string, line: number, character: number) => {
    const result = await trpcCall('lsp', 'signatureHelp', { uri, line, character }, 'query');
    if (result) {
      return {
        signatures: result.signatures.map((sig: any) => ({
          label: sig.label,
          documentation: typeof sig.documentation === 'string' ? sig.documentation : sig.documentation?.value,
          parameters: sig.parameters?.map((p: any) => ({
            label: p.label,
            documentation: typeof p.documentation === 'string' ? p.documentation : p.documentation?.value,
          })),
        })),
        activeSignature: result.activeSignature,
        activeParameter: result.activeParameter,
      };
    }
    return null;
  },

  getCodeActions: async (uri: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number, diagnostics?: Diagnostic[]) => {
    const result = await trpcCall('lsp', 'codeAction', {
      uri,
      startLine,
      startCharacter,
      endLine,
      endCharacter,
      diagnostics,
    }, 'query');
    return result;
  },

  formatDocument: async (uri: string, tabSize = 2, insertSpaces = true) => {
    const result = await trpcCall('lsp', 'formatting', { uri, tabSize, insertSpaces }, 'mutation');
    return result;
  },

  // Clear actions
  clearHover: () => set({ hover: null, hoverPosition: null }),
  clearCompletions: () => set({ completions: [], completionPosition: null }),
  clearDiagnostics: (uri?: string) => {
    if (uri) {
      const diagnostics = new Map(get().diagnostics);
      diagnostics.delete(uri);
      set({ diagnostics });
    } else {
      set({ diagnostics: new Map() });
    }
  },
}));
