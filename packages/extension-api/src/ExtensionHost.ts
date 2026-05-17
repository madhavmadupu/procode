import { ExtensionContext, Disposable, Command, Terminal, TerminalOptions, OutputChannel, StatusBarItem, WorkspaceFolder, TextDocument, TextEditor, Uri, Diagnostic, CompletionItemProvider, HoverProvider, DefinitionProvider, TreeDataProvider, TreeItem, WebviewPanel, WebviewOptions } from "./ExtensionTypes";

export interface ExtensionManifest {
  name: string;
  displayName: string;
  version: string;
  description?: string;
  main: string;
  activationEvents?: string[];
  contributes?: {
    commands?: { command: string; title: string }[];
    languages?: { id: string; extensions?: string[] }[];
  };
  dependencies?: Record<string, string>;
}

export interface RegisteredExtension {
  manifest: ExtensionManifest;
  context: ExtensionContext;
  isActive: boolean;
  exports?: unknown;
}

class SimpleMemento {
  private data = new Map<string, unknown>();

  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string, defaultValue?: T): T | undefined {
    const value = this.data.get(key);
    return value !== undefined ? (value as T) : defaultValue;
  }

  async update(key: string, value: unknown): Promise<void> {
    this.data.set(key, value);
  }

  keys(): readonly string[] {
    return Array.from(this.data.keys());
  }
}

export class ExtensionHost {
  private extensions = new Map<string, RegisteredExtension>();
  private commands = new Map<string, (...args: unknown[]) => unknown>();
  private terminals = new Map<string, Terminal>();
  private outputChannels = new Map<string, OutputChannel>();
  private statusBarItems = new Map<string, StatusBarItem>();
  private workspaceFolders: WorkspaceFolder[] = [];
  private onDidOpenTextDocumentListeners: ((doc: TextDocument) => void)[] = [];
  private onDidChangeTextDocumentListeners: ((doc: TextDocument) => void)[] = [];
  private onDidCloseTextDocumentListeners: ((doc: TextDocument) => void)[] = [];

  setWorkspaceFolders(folders: WorkspaceFolder[]): void {
    this.workspaceFolders = folders;
  }

  async registerExtension(manifest: ExtensionManifest, extensionPath: string): Promise<void> {
    const context: ExtensionContext = {
      extensionPath,
      globalState: new SimpleMemento(),
      workspaceState: new SimpleMemento(),
      subscriptions: [],
      asAbsolutePath: (relativePath: string) => `${extensionPath}/${relativePath}`,
    };

    this.extensions.set(manifest.name, {
      manifest,
      context,
      isActive: false,
    });
  }

  async activateExtension(name: string, activate: (context: ExtensionContext) => Promise<void>): Promise<void> {
    const ext = this.extensions.get(name);
    if (!ext || ext.isActive) return;

    await activate(ext.context);
    ext.isActive = true;
  }

  registerCommand(id: string, handler: (...args: unknown[]) => unknown): Disposable {
    this.commands.set(id, handler);
    return {
      dispose: () => {
        this.commands.delete(id);
      },
    };
  }

  executeCommand<T>(id: string, ...args: unknown[]): Promise<T | undefined> {
    const handler = this.commands.get(id);
    if (!handler) {
      throw new Error(`Command '${id}' not found`);
    }
    return Promise.resolve(handler(...args) as T);
  }

  getCommands(): string[] {
    return Array.from(this.commands.keys());
  }

  createTerminal(options?: TerminalOptions): Terminal {
    const id = `ext-term-${Date.now()}`;
    const terminal: Terminal = {
      name: options?.name ?? "Extension Terminal",
      sendText: (text: string, addNewLine = true) => {
        console.log(`[Terminal ${id}] ${text}${addNewLine ? "\n" : ""}`);
      },
      show: () => console.log(`[Terminal ${id}] show`),
      hide: () => console.log(`[Terminal ${id}] hide`),
      dispose: () => {
        this.terminals.delete(id);
      },
    };
    this.terminals.set(id, terminal);
    return terminal;
  }

  createOutputChannel(name: string): OutputChannel {
    const channel: OutputChannel = {
      name,
      append: (value: string) => console.log(`[${name}] ${value}`),
      appendLine: (value: string) => console.log(`[${name}] ${value}`),
      clear: () => console.log(`[${name}] cleared`),
      show: () => console.log(`[${name}] show`),
      hide: () => console.log(`[${name}] hide`),
      dispose: () => {
        this.outputChannels.delete(name);
      },
    };
    this.outputChannels.set(name, channel);
    return channel;
  }

  createStatusBarItem(alignment: number, priority?: number): StatusBarItem {
    const id = `status-${Date.now()}`;
    const item: StatusBarItem = {
      alignment,
      text: "",
      show: () => console.log(`[StatusBar ${id}] show: ${item.text}`),
      hide: () => console.log(`[StatusBar ${id}] hide`),
      dispose: () => {
        this.statusBarItems.delete(id);
      },
    };
    this.statusBarItems.set(id, item);
    return item;
  }

  registerCompletionItemProvider(
    selector: string,
    provider: CompletionItemProvider
  ): Disposable {
    console.log(`[ExtensionHost] Registered completion provider for ${selector}`);
    return { dispose: () => {} };
  }

  registerHoverProvider(
    selector: string,
    provider: HoverProvider
  ): Disposable {
    console.log(`[ExtensionHost] Registered hover provider for ${selector}`);
    return { dispose: () => {} };
  }

  registerDefinitionProvider(
    selector: string,
    provider: DefinitionProvider
  ): Disposable {
    console.log(`[ExtensionHost] Registered definition provider for ${selector}`);
    return { dispose: () => {} };
  }

  registerTreeDataProvider<T>(
    viewId: string,
    treeDataProvider: TreeDataProvider<T>
  ): Disposable {
    console.log(`[ExtensionHost] Registered tree data provider for ${viewId}`);
    return { dispose: () => {} };
  }

  createWebviewPanel(
    viewType: string,
    title: string,
    showOptions: unknown,
    options?: WebviewOptions
  ): WebviewPanel {
    const id = `webview-${Date.now()}`;
    const panel: WebviewPanel = {
      title,
      visible: true,
      active: true,
      webview: {
        html: "",
        options,
        onDidReceiveMessage: () => ({ dispose: () => {} }),
        postMessage: () => Promise.resolve(true),
        asWebviewUri: (uri) => uri,
      },
      reveal: () => console.log(`[Webview ${id}] reveal`),
      dispose: () => console.log(`[Webview ${id}] dispose`),
      onDidDispose: () => ({ dispose: () => {} }),
      onDidChangeViewState: () => ({ dispose: () => {} }),
    };
    return panel;
  }

  onDidOpenTextDocument(listener: (doc: TextDocument) => void): Disposable {
    this.onDidOpenTextDocumentListeners.push(listener);
    return { dispose: () => {
      const idx = this.onDidOpenTextDocumentListeners.indexOf(listener);
      if (idx >= 0) this.onDidOpenTextDocumentListeners.splice(idx, 1);
    }};
  }

  onDidChangeTextDocument(listener: (doc: TextDocument) => void): Disposable {
    this.onDidChangeTextDocumentListeners.push(listener);
    return { dispose: () => {
      const idx = this.onDidChangeTextDocumentListeners.indexOf(listener);
      if (idx >= 0) this.onDidChangeTextDocumentListeners.splice(idx, 1);
    }};
  }

  onDidCloseTextDocument(listener: (doc: TextDocument) => void): Disposable {
    this.onDidCloseTextDocumentListeners.push(listener);
    return { dispose: () => {
      const idx = this.onDidCloseTextDocumentListeners.indexOf(listener);
      if (idx >= 0) this.onDidCloseTextDocumentListeners.splice(idx, 1);
    }};
  }

  fireOnDidOpenTextDocument(doc: TextDocument): void {
    for (const listener of this.onDidOpenTextDocumentListeners) {
      listener(doc);
    }
  }

  fireOnDidChangeTextDocument(doc: TextDocument): void {
    for (const listener of this.onDidChangeTextDocumentListeners) {
      listener(doc);
    }
  }

  fireOnDidCloseTextDocument(doc: TextDocument): void {
    for (const listener of this.onDidCloseTextDocumentListeners) {
      listener(doc);
    }
  }

  getExtension(name: string): RegisteredExtension | undefined {
    return this.extensions.get(name);
  }

  getAllExtensions(): RegisteredExtension[] {
    return Array.from(this.extensions.values());
  }

  deactivateExtension(name: string): void {
    const ext = this.extensions.get(name);
    if (ext) {
      for (const sub of ext.context.subscriptions) {
        sub.dispose();
      }
      ext.isActive = false;
    }
  }

  deactivateAll(): void {
    for (const name of this.extensions.keys()) {
      this.deactivateExtension(name);
    }
    this.extensions.clear();
    this.commands.clear();
    this.terminals.clear();
    this.outputChannels.clear();
    this.statusBarItems.clear();
  }
}
