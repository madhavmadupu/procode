import { create } from 'zustand';
import type { Diagnostic, HoverResult, DefinitionResult, SymbolInfo, WorkspaceSymbolResult, Completion, LspServerState, RenameResult, SignatureHelpResult } from '@procode/types';
import { trpc } from '../lib/trpc';

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
  getDefinition: (uri: string, line: number, character: number) => Promise<DefinitionResult | DefinitionResult[] | null>;
  getReferences: (uri: string, line: number, character: number, includeDeclaration?: boolean) => Promise<DefinitionResult[] | null>;
  getDocumentSymbols: (uri: string) => Promise<SymbolInfo[] | null>;
  searchWorkspaceSymbols: (query: string) => Promise<void>;
  rename: (uri: string, line: number, character: number, newName: string) => Promise<RenameResult | null>;
  getSignatureHelp: (uri: string, line: number, character: number) => Promise<SignatureHelpResult | null>;
  getCodeActions: (uri: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number, diagnostics?: Diagnostic[]) => Promise<any[] | null>;
  formatDocument: (uri: string, tabSize?: number, insertSpaces?: boolean) => Promise<any[] | null>;

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
    await trpc.lsp.startServer({ serverId, rootPath });
    await get().refreshServerStates();
  },

  stopServer: async (serverId: string) => {
    await trpc.lsp.stopServer({ serverId });
    await get().refreshServerStates();
  },

  stopAllServers: async () => {
    await trpc.lsp.stopAll();
    set({ servers: [] });
  },

  refreshServerStates: async () => {
    const servers = await trpc.lsp.getServerStates();
    set({ servers: servers as LspServerState[] });
  },

  // Document lifecycle
  documentDidOpen: async (uri: string, languageId: string, version: number, text: string) => {
    await trpc.lsp.didOpen({ uri, languageId, version, text });
  },

  documentDidChange: async (uri: string, version: number, changes: { range?: { start: { line: number; character: number }; end: { line: number; character: number } }; text: string }[]) => {
    await trpc.lsp.didChange({ uri, version, changes });
  },

  documentDidClose: async (uri: string) => {
    await trpc.lsp.didClose({ uri });
  },

  documentDidSave: async (uri: string, text?: string) => {
    await trpc.lsp.didSave({ uri, text });
  },

  // LSP operations
  getCompletions: async (uri: string, line: number, character: number, triggerKind?: number, triggerCharacter?: string) => {
    set({ isCompleting: true });
    try {
      const completions = await trpc.lsp.completion({ uri, line, character, triggerKind, triggerCharacter });
      set({
        completions,
        completionPosition: { line, character },
        isCompleting: false,
      });
    } catch (error) {
      console.error('Failed to get completions:', error);
      set({ isCompleting: false });
    }
  },

  getHover: async (uri: string, line: number, character: number) => {
    const result = await trpc.lsp.hover({ uri, line, character });
    if (result) {
      set({
        hover: result,
        hoverPosition: { line, character },
      });
    } else {
      set({ hover: null, hoverPosition: null });
    }
  },

  getDefinition: async (uri: string, line: number, character: number) => {
    return await trpc.lsp.definition({ uri, line, character });
  },

  getReferences: async (uri: string, line: number, character: number, includeDeclaration = true) => {
    return await trpc.lsp.references({ uri, line, character, includeDeclaration });
  },

  getDocumentSymbols: async (uri: string) => {
    return await trpc.lsp.documentSymbols({ uri });
  },

  searchWorkspaceSymbols: async (query: string) => {
    set({ isSearchingSymbols: true });
    try {
      const workspaceSymbols = await trpc.lsp.workspaceSymbols({ query });
      set({
        workspaceSymbols,
        isSearchingSymbols: false,
      });
    } catch (error) {
      console.error('Failed to search workspace symbols:', error);
      set({ workspaceSymbols: [], isSearchingSymbols: false });
    }
  },

  rename: async (uri: string, line: number, character: number, newName: string) => {
    return await trpc.lsp.rename({ uri, line, character, newName });
  },

  getSignatureHelp: async (uri: string, line: number, character: number) => {
    return await trpc.lsp.signatureHelp({ uri, line, character });
  },

  getCodeActions: async (uri: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number, diagnostics?: Diagnostic[]) => {
    return await trpc.lsp.codeAction({
      uri,
      startLine,
      startCharacter,
      endLine,
      endCharacter,
      diagnostics,
    });
  },

  formatDocument: async (uri: string, tabSize = 2, insertSpaces = true) => {
    return await trpc.lsp.formatting({ uri, tabSize, insertSpaces });
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
