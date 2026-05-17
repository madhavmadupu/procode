import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
} from './JsonRpc.js';
import type {
  InitializeParams,
  InitializeResult,
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
  CallHierarchyPrepareParams,
  CallHierarchyItem,
  CallHierarchyIncomingCallsParams,
  CallHierarchyIncomingCall,
  CallHierarchyOutgoingCallsParams,
  CallHierarchyOutgoingCall,
  DidChangeConfigurationParams,
  ExecuteCommandParams,
  ServerCapabilities,
} from './LspProtocol.js';
import type { LSPConfig } from '@procode/types';

export type ServerState = 'stopped' | 'starting' | 'running' | 'error';

export interface ServerEvents {
  stateChange: (state: ServerState) => void;
  diagnostics: (params: PublishDiagnosticsParams) => void;
  showMessage: (params: { type: number; message: string }) => void;
  logMessage: (params: { type: number; message: string }) => void;
  error: (error: Error) => void;
}

export class LanguageServer extends EventEmitter {
  private process: ChildProcess | null = null;
  private state: ServerState = 'stopped';
  private requestId = 0;
  private pendingRequests = new Map<number | string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private messageBuffer = '';
  private rootUri: string | null = null;
  private capabilities: ServerCapabilities | null = null;
  private config: LSPConfig;

  constructor(config: LSPConfig) {
    super();
    this.config = config;
  }

  get serverId(): string {
    return this.config.serverId;
  }

  get currentState(): ServerState {
    return this.state;
  }

  get serverCapabilities(): ServerCapabilities | null {
    return this.capabilities;
  }

  async start(rootPath: string): Promise<void> {
    if (this.state !== 'stopped') {
      throw new Error(`Server ${this.config.serverId} is already ${this.state}`);
    }

    this.setState('starting');
    this.rootUri = `file://${rootPath}`;

    try {
      this.process = spawn(this.config.command, this.config.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      this.process.stdout?.on('data', (data: Buffer) => {
        this.handleMessage(data.toString());
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        const message = data.toString();
        this.emit('logMessage', { type: 1, message });
      });

      this.process.on('error', (error: Error) => {
        this.setState('error');
        this.emit('error', error);
      });

      this.process.on('exit', (code: number | null) => {
        this.setState('stopped');
        this.process = null;
        this.rejectAllPending(new Error(`Server exited with code ${code}`));
      });

      await this.initialize();
      this.setState('running');
    } catch (error) {
      this.setState('error');
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.state !== 'running') {
      return;
    }

    try {
      await this.sendRequest('shutdown', {});
      this.sendNotification('exit', {});
    } catch {
      // Ignore errors during shutdown
    }

    if (this.process) {
      this.process.kill();
      this.process = null;
    }

    this.setState('stopped');
    this.capabilities = null;
  }

  async initialize(): Promise<InitializeResult> {
    const params: InitializeParams = {
      processId: process.pid,
      clientInfo: { name: 'ProCode', version: '0.0.1' },
      rootUri: this.rootUri,
      capabilities: {
        workspace: {
          workspaceFolders: true,
          didChangeConfiguration: { dynamicRegistration: false },
          didChangeWatchedFiles: { dynamicRegistration: false },
        },
        textDocument: {
          synchronization: {
            dynamicRegistration: false,
            willSave: false,
            didSave: true,
            willSaveWaitUntil: false,
          },
          completion: {
            dynamicRegistration: false,
            completionItem: {
              snippetSupport: true,
              commitCharactersSupport: true,
              documentationFormat: ['markdown', 'plaintext'],
              deprecatedSupport: true,
              preselectSupport: true,
            },
            contextSupport: true,
          },
          hover: {
            dynamicRegistration: false,
            contentFormat: ['markdown', 'plaintext'],
          },
          signatureHelp: {
            dynamicRegistration: false,
            signatureInformation: {
              documentationFormat: ['markdown', 'plaintext'],
              parameterInformation: { labelOffsetSupport: true },
            },
          },
          definition: { dynamicRegistration: false, linkSupport: false },
          typeDefinition: { dynamicRegistration: false, linkSupport: false },
          implementation: { dynamicRegistration: false, linkSupport: false },
          references: { dynamicRegistration: false },
          documentHighlight: { dynamicRegistration: false },
          documentSymbol: {
            dynamicRegistration: false,
            hierarchicalDocumentSymbolSupport: true,
          },
          codeAction: {
            dynamicRegistration: false,
            codeActionLiteralSupport: {
              codeActionKind: { valueSet: ['quickfix', 'refactor', 'refactor.extract', 'refactor.inline', 'refactor.rewrite', 'source', 'source.organizeImports'] },
            },
          },
          codeLens: { dynamicRegistration: false },
          documentFormatting: { dynamicRegistration: false },
          documentRangeFormatting: { dynamicRegistration: false },
          rename: { dynamicRegistration: false, prepareSupport: true },
          publishDiagnostics: {
            relatedInformation: true,
            tagSupport: { valueSet: [1, 2] },
            versionSupport: true,
          },
          semanticTokens: {
            dynamicRegistration: false,
            requests: { range: true, full: { delta: true } },
            tokenTypes: [
              'namespace', 'type', 'class', 'enum', 'interface', 'struct',
              'typeParameter', 'parameter', 'variable', 'property', 'enumMember',
              'event', 'function', 'method', 'macro', 'keyword', 'modifier',
              'comment', 'string', 'number', 'regexp', 'operator', 'decorator',
            ],
            tokenModifiers: [
              'declaration', 'definition', 'readonly', 'static', 'deprecated',
              'abstract', 'async', 'modification', 'documentation', 'defaultLibrary',
            ],
            formats: ['relative'],
          },
          inlayHint: { dynamicRegistration: false },
          callHierarchy: { dynamicRegistration: false },
          typeHierarchy: { dynamicRegistration: false },
        },
        window: {
          workDoneProgress: false,
          showMessage: { messageActionItem: { additionalPropertiesSupport: false } },
        },
      },
      trace: 'off',
      workspaceFolders: this.rootUri ? [{ uri: this.rootUri, name: 'workspace' }] : undefined,
    };

    const result = await this.sendRequest('initialize', params) as InitializeResult;
    this.capabilities = result.capabilities;
    this.sendNotification('initialized', {});
    return result;
  }

  async didOpen(params: DidOpenTextDocumentParams): Promise<void> {
    this.sendNotification('textDocument/didOpen', params);
  }

  async didChange(params: DidChangeTextDocumentParams): Promise<void> {
    this.sendNotification('textDocument/didChange', params);
  }

  async didClose(params: DidCloseTextDocumentParams): Promise<void> {
    this.sendNotification('textDocument/didClose', params);
  }

  async didSave(params: DidSaveTextDocumentParams): Promise<void> {
    if (this.capabilities?.textDocumentSync && typeof this.capabilities.textDocumentSync === 'object' && this.capabilities.textDocumentSync.save) {
      this.sendNotification('textDocument/didSave', params);
    }
  }

  async completion(params: CompletionParams): Promise<CompletionList> {
    if (!this.capabilities?.completionProvider) {
      return { isIncomplete: false, items: [] };
    }
    const result = await this.sendRequest('textDocument/completion', params);
    if (Array.isArray(result)) {
      return { isIncomplete: false, items: result };
    }
    return result as CompletionList;
  }

  async hover(params: HoverParams): Promise<Hover | null> {
    if (!this.capabilities?.hoverProvider) {
      return null;
    }
    return this.sendRequest('textDocument/hover', params) as Promise<Hover | null>;
  }

  async definition(params: DefinitionParams): Promise<Definition | null> {
    if (!this.capabilities?.definitionProvider) {
      return null;
    }
    return this.sendRequest('textDocument/definition', params) as Promise<Definition | null>;
  }

  async references(params: ReferenceParams): Promise<Location[] | null> {
    if (!this.capabilities?.referencesProvider) {
      return null;
    }
    return this.sendRequest('textDocument/references', params) as Promise<Location[] | null>;
  }

  async documentSymbols(params: DocumentSymbolParams): Promise<DocumentSymbol[] | null> {
    if (!this.capabilities?.documentSymbolProvider) {
      return null;
    }
    return this.sendRequest('textDocument/documentSymbol', params) as Promise<DocumentSymbol[] | null>;
  }

  async workspaceSymbols(params: WorkspaceSymbolParams): Promise<WorkspaceSymbol[] | null> {
    if (!this.capabilities?.workspaceSymbolProvider) {
      return null;
    }
    return this.sendRequest('workspace/symbol', params) as Promise<WorkspaceSymbol[] | null>;
  }

  async rename(params: RenameParams): Promise<WorkspaceEdit | null> {
    if (!this.capabilities?.renameProvider) {
      return null;
    }
    return this.sendRequest('textDocument/rename', params) as Promise<WorkspaceEdit | null>;
  }

  async signatureHelp(params: SignatureHelpParams): Promise<SignatureHelp | null> {
    if (!this.capabilities?.signatureHelpProvider) {
      return null;
    }
    return this.sendRequest('textDocument/signatureHelp', params) as Promise<SignatureHelp | null>;
  }

  async codeAction(params: CodeActionParams): Promise<(CodeAction | Command)[] | null> {
    if (!this.capabilities?.codeActionProvider) {
      return null;
    }
    return this.sendRequest('textDocument/codeAction', params) as Promise<(CodeAction | Command)[] | null>;
  }

  async codeLens(params: CodeLensParams): Promise<CodeLens[] | null> {
    if (!this.capabilities?.codeLensProvider) {
      return null;
    }
    return this.sendRequest('textDocument/codeLens', params) as Promise<CodeLens[] | null>;
  }

  async formatting(params: DocumentFormattingParams): Promise<TextEdit[] | null> {
    if (!this.capabilities?.documentFormattingProvider) {
      return null;
    }
    return this.sendRequest('textDocument/formatting', params) as Promise<TextEdit[] | null>;
  }

  async rangeFormatting(params: DocumentRangeFormattingParams): Promise<TextEdit[] | null> {
    if (!this.capabilities?.documentRangeFormattingProvider) {
      return null;
    }
    return this.sendRequest('textDocument/rangeFormatting', params) as Promise<TextEdit[] | null>;
  }

  async semanticTokens(params: SemanticTokensParams): Promise<SemanticTokens | null> {
    if (!this.capabilities?.semanticTokensProvider) {
      return null;
    }
    return this.sendRequest('textDocument/semanticTokens/full', params) as Promise<SemanticTokens | null>;
  }

  async inlayHints(params: InlayHintParams): Promise<InlayHint[] | null> {
    if (!this.capabilities?.inlayHintProvider) {
      return null;
    }
    return this.sendRequest('textDocument/inlayHint', params) as Promise<InlayHint[] | null>;
  }

  async prepareCallHierarchy(params: CallHierarchyPrepareParams): Promise<CallHierarchyItem[] | null> {
    if (!this.capabilities?.callHierarchyProvider) {
      return null;
    }
    return this.sendRequest('textDocument/prepareCallHierarchy', params) as Promise<CallHierarchyItem[] | null>;
  }

  async incomingCalls(params: CallHierarchyIncomingCallsParams): Promise<CallHierarchyIncomingCall[] | null> {
    return this.sendRequest('callHierarchy/incomingCalls', params) as Promise<CallHierarchyIncomingCall[] | null>;
  }

  async outgoingCalls(params: CallHierarchyOutgoingCallsParams): Promise<CallHierarchyOutgoingCall[] | null> {
    return this.sendRequest('callHierarchy/outgoingCalls', params) as Promise<CallHierarchyOutgoingCall[] | null>;
  }

  async executeCommand(params: ExecuteCommandParams): Promise<unknown> {
    if (!this.capabilities?.executeCommandProvider) {
      throw new Error('Server does not support executeCommand');
    }
    return this.sendRequest('workspace/executeCommand', params);
  }

  async updateConfiguration(settings: unknown): Promise<void> {
    const params: DidChangeConfigurationParams = { settings };
    this.sendNotification('workspace/didChangeConfiguration', params);
  }

  private sendRequest(method: string, params: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${method} timed out after 30s`));
      }, 30000);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      this.send(request);
    });
  }

  private sendNotification(method: string, params: unknown): void {
    const notification: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
      params,
    };
    this.send(notification);
  }

  private send(message: JsonRpcRequest | JsonRpcNotification): void {
    if (!this.process?.stdin) {
      throw new Error('Server process not available');
    }

    const content = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(content, 'utf-8')}\r\n\r\n`;
    this.process.stdin.write(header + content, 'utf-8');
  }

  private handleMessage(data: string): void {
    this.messageBuffer += data;

    while (this.messageBuffer.length > 0) {
      const headerEnd = this.messageBuffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) {
        break;
      }

      const header = this.messageBuffer.substring(0, headerEnd);
      const contentLengthMatch = header.match(/Content-Length: (\d+)/i);
      if (!contentLengthMatch || !contentLengthMatch[1]) {
        this.messageBuffer = this.messageBuffer.substring(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(contentLengthMatch[1], 10);
      const messageStart = headerEnd + 4;

      if (this.messageBuffer.length < messageStart + contentLength) {
        break;
      }

      const content = this.messageBuffer.substring(messageStart, messageStart + contentLength);
      this.messageBuffer = this.messageBuffer.substring(messageStart + contentLength);

      try {
        const message = JSON.parse(content) as JsonRpcResponse | JsonRpcNotification;
        this.dispatchMessage(message);
      } catch (error) {
        this.emit('error', new Error(`Failed to parse LSP message: ${error}`));
      }
    }
  }

  private dispatchMessage(message: JsonRpcResponse | JsonRpcNotification): void {
    if ('id' in message && message.id !== undefined) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.id);

        if ('error' in message && message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result);
        }
      }
    } else if ('method' in message) {
      const notification = message as JsonRpcNotification;
      this.handleNotification(notification);
    }
  }

  private handleNotification(notification: JsonRpcNotification): void {
    const { method, params } = notification;

    switch (method) {
      case 'textDocument/publishDiagnostics':
        this.emit('diagnostics', params as PublishDiagnosticsParams);
        break;
      case 'window/showMessage':
        this.emit('showMessage', params as { type: number; message: string });
        break;
      case 'window/logMessage':
        this.emit('logMessage', params as { type: number; message: string });
        break;
      case '$/progress':
        // Handle progress notifications
        break;
      default:
        // Unknown notification
        break;
    }
  }

  private setState(state: ServerState): void {
    this.state = state;
    this.emit('stateChange', state);
  }

  private rejectAllPending(error: Error): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }
}
