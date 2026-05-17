import { LanguageServer, ServerState } from './LanguageServer.js';
import type { LSPConfig } from '@procode/types';
import type {
  DidOpenTextDocumentParams,
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  DidSaveTextDocumentParams,
  CompletionParams,
  CompletionList,
  HoverParams,
  Hover,
  DefinitionParams,
  Definition,
  ReferenceParams,
  Location,
  DocumentSymbolParams,
  DocumentSymbol,
  WorkspaceSymbolParams,
  WorkspaceSymbol,
  RenameParams,
  WorkspaceEdit,
  PublishDiagnosticsParams,
  SignatureHelpParams,
  SignatureHelp,
  CodeActionParams,
  CodeAction,
  Command,
  CodeLensParams,
  CodeLens,
  DocumentFormattingParams,
  TextEdit,
  DocumentRangeFormattingParams,
  SemanticTokensParams,
  SemanticTokens,
  InlayHintParams,
  InlayHint,
} from './LspProtocol.js';

export interface LspHostEvents {
  serverStarted: (serverId: string) => void;
  serverStopped: (serverId: string) => void;
  serverError: (serverId: string, error: Error) => void;
  diagnostics: (serverId: string, params: PublishDiagnosticsParams) => void;
}

export class LSPHost {
  private servers = new Map<string, LanguageServer>();
  private configs = new Map<string, LSPConfig>();
  private fileToServer = new Map<string, string>();

  registerConfig(config: LSPConfig): void {
    this.configs.set(config.serverId, config);
  }

  getConfig(serverId: string): LSPConfig | undefined {
    return this.configs.get(serverId);
  }

  getAllConfigs(): LSPConfig[] {
    return Array.from(this.configs.values());
  }

  async startServer(serverId: string, rootPath: string): Promise<void> {
    const config = this.configs.get(serverId);
    if (!config) {
      throw new Error(`No configuration found for server: ${serverId}`);
    }

    if (this.servers.has(serverId)) {
      throw new Error(`Server ${serverId} is already registered`);
    }

    const server = new LanguageServer(config);

    server.on('stateChange', (state: ServerState) => {
      if (state === 'running') {
        this.emit('serverStarted', serverId);
      } else if (state === 'stopped') {
        this.emit('serverStopped', serverId);
      }
    });

    server.on('diagnostics', (params: PublishDiagnosticsParams) => {
      this.emit('diagnostics', serverId, params);
    });

    server.on('error', (error: Error) => {
      this.emit('serverError', serverId, error);
    });

    this.servers.set(serverId, server);
    await server.start(rootPath);

    // Register file patterns for this server
    for (const pattern of config.filePatterns) {
      this.fileToServer.set(pattern, serverId);
    }
  }

  async stopServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      return;
    }

    await server.stop();
    this.servers.delete(serverId);
  }

  async stopAll(): Promise<void> {
    const promises = Array.from(this.servers.keys()).map(id => this.stopServer(id));
    await Promise.all(promises);
  }

  getServer(serverId: string): LanguageServer | undefined {
    return this.servers.get(serverId);
  }

  getServerForFile(filePath: string): LanguageServer | undefined {
    for (const [pattern, serverId] of this.fileToServer) {
      if (this.matchesPattern(filePath, pattern)) {
        return this.servers.get(serverId);
      }
    }
    return undefined;
  }

  getServerState(serverId: string): ServerState | undefined {
    return this.servers.get(serverId)?.currentState;
  }

  getAllServerStates(): Map<string, ServerState> {
    const states = new Map<string, ServerState>();
    for (const [id, server] of this.servers) {
      states.set(id, server.currentState);
    }
    return states;
  }

  async didOpen(params: DidOpenTextDocumentParams): Promise<void> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (server) {
      await server.didOpen(params);
    }
  }

  async didChange(params: DidChangeTextDocumentParams): Promise<void> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (server) {
      await server.didChange(params);
    }
  }

  async didClose(params: DidCloseTextDocumentParams): Promise<void> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (server) {
      await server.didClose(params);
    }
  }

  async didSave(params: DidSaveTextDocumentParams): Promise<void> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (server) {
      await server.didSave(params);
    }
  }

  async completion(params: CompletionParams): Promise<CompletionList> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (!server) {
      return { isIncomplete: false, items: [] };
    }
    return server.completion(params);
  }

  async hover(params: HoverParams): Promise<Hover | null> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (!server) {
      return null;
    }
    return server.hover(params);
  }

  async definition(params: DefinitionParams): Promise<Definition | null> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (!server) {
      return null;
    }
    return server.definition(params);
  }

  async references(params: ReferenceParams): Promise<Location[] | null> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (!server) {
      return null;
    }
    return server.references(params);
  }

  async documentSymbols(params: DocumentSymbolParams): Promise<DocumentSymbol[] | null> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (!server) {
      return null;
    }
    return server.documentSymbols(params);
  }

  async workspaceSymbols(params: WorkspaceSymbolParams): Promise<WorkspaceSymbol[] | null> {
    // Search across all servers
    const results: WorkspaceSymbol[] = [];
    for (const server of this.servers.values()) {
      const symbols = await server.workspaceSymbols(params);
      if (symbols) {
        results.push(...symbols);
      }
    }
    return results;
  }

  async rename(params: RenameParams): Promise<WorkspaceEdit | null> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (!server) {
      return null;
    }
    return server.rename(params);
  }

  async signatureHelp(params: SignatureHelpParams): Promise<SignatureHelp | null> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (!server) {
      return null;
    }
    return server.signatureHelp(params);
  }

  async codeAction(params: CodeActionParams): Promise<(CodeAction | Command)[] | null> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (!server) {
      return null;
    }
    return server.codeAction(params);
  }

  async codeLens(params: CodeLensParams): Promise<CodeLens[] | null> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (!server) {
      return null;
    }
    return server.codeLens(params);
  }

  async formatting(params: DocumentFormattingParams): Promise<TextEdit[] | null> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (!server) {
      return null;
    }
    return server.formatting(params);
  }

  async rangeFormatting(params: DocumentRangeFormattingParams): Promise<TextEdit[] | null> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (!server) {
      return null;
    }
    return server.rangeFormatting(params);
  }

  async semanticTokens(params: SemanticTokensParams): Promise<SemanticTokens | null> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (!server) {
      return null;
    }
    return server.semanticTokens(params);
  }

  async inlayHints(params: InlayHintParams): Promise<InlayHint[] | null> {
    const server = this.getServerForFile(params.textDocument.uri);
    if (!server) {
      return null;
    }
    return server.inlayHints(params);
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple glob matching for file patterns
    const regex = new RegExp(
      '^' + pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.') + '$'
    );
    return regex.test(filePath);
  }

  private events = new Map<string, Set<Function>>();

  on(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    this.events.get(event)?.delete(listener);
  }

  private emit(event: string, ...args: unknown[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener(...args);
      }
    }
  }
}
