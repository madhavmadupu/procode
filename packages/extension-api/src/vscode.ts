import { ExtensionHost } from "./ExtensionHost";
import {
  Disposable, Command, TextEditor, TextDocument, TextLine, TextEditorEdit,
  Position, Range, Selection, WorkspaceFolder, Terminal, TerminalOptions,
  OutputChannel, StatusBarItem, CancellationToken, Event, Uri, Diagnostic,
  DiagnosticSeverity, CompletionItem, CompletionItemKind, CompletionItemProvider,
  Hover, HoverProvider, Definition, DefinitionProvider, ProviderResult,
  TreeDataProvider, TreeItem, TreeItemCollapsibleState, WebviewPanel, WebviewOptions,
  ExtensionContext, Memento, EndOfLine, FileSystemWatcher,
} from "./ExtensionTypes";

let host: ExtensionHost | null = null;

export function initialize(extensionHost: ExtensionHost): void {
  host = extensionHost;
}

function getHost(): ExtensionHost {
  if (!host) {
    throw new Error("Extension API not initialized. Call initialize() first.");
  }
  return host;
}

export const vscode = {
  Disposable,
  EndOfLine,
  DiagnosticSeverity,
  CompletionItemKind,
  TreeItemCollapsibleState,

  commands: {
    registerCommand(id: string, handler: (...args: unknown[]) => unknown): Disposable {
      return getHost().registerCommand(id, handler);
    },
    executeCommand<T>(id: string, ...args: unknown[]): Promise<T | undefined> {
      return getHost().executeCommand(id, ...args);
    },
    getCommands(): Promise<string[]> {
      return Promise.resolve(getHost().getCommands());
    },
  },

  window: {
    createTerminal(options?: TerminalOptions): Terminal {
      return getHost().createTerminal(options);
    },
    createOutputChannel(name: string): OutputChannel {
      return getHost().createOutputChannel(name);
    },
    createStatusBarItem(alignment: number, priority?: number): StatusBarItem {
      return getHost().createStatusBarItem(alignment, priority);
    },
    createWebviewPanel(
      viewType: string,
      title: string,
      showOptions: unknown,
      options?: WebviewOptions
    ): WebviewPanel {
      return getHost().createWebviewPanel(viewType, title, showOptions, options);
    },
  },

  workspace: {
    workspaceFolders: [] as WorkspaceFolder[] | undefined,
    onDidOpenTextDocument(listener: (doc: TextDocument) => void): Disposable {
      return getHost().onDidOpenTextDocument(listener);
    },
    onDidChangeTextDocument(listener: (doc: TextDocument) => void): Disposable {
      return getHost().onDidChangeTextDocument(listener);
    },
    onDidCloseTextDocument(listener: (doc: TextDocument) => void): Disposable {
      return getHost().onDidCloseTextDocument(listener);
    },
    createFileSystemWatcher(globPattern: string): FileSystemWatcher {
      console.log(`[workspace] createFileSystemWatcher: ${globPattern}`);
      return {
        onDidCreate: () => ({ dispose: () => {} }),
        onDidDelete: () => ({ dispose: () => {} }),
        onDidChange: () => ({ dispose: () => {} }),
        dispose: () => {},
      };
    },
  },

  languages: {
    registerCompletionItemProvider(
      selector: string,
      provider: CompletionItemProvider
    ): Disposable {
      return getHost().registerCompletionItemProvider(selector, provider);
    },
    registerHoverProvider(selector: string, provider: HoverProvider): Disposable {
      return getHost().registerHoverProvider(selector, provider);
    },
    registerDefinitionProvider(
      selector: string,
      provider: DefinitionProvider
    ): Disposable {
      return getHost().registerDefinitionProvider(selector, provider);
    },
  },

  extensions: {
    getExtension(name: string) {
      return getHost().getExtension(name);
    },
    get all() {
      return getHost().getAllExtensions();
    },
  },
};
