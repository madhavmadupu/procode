export interface ExtensionContext {
  extensionPath: string;
  globalState: Memento;
  workspaceState: Memento;
  subscriptions: Disposable[];
  asAbsolutePath(relativePath: string): string;
}

export interface Memento {
  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  update(key: string, value: unknown): Promise<void>;
  keys(): readonly string[];
}

export interface Disposable {
  dispose(): void;
}

export namespace Disposable {
  export function from(...disposableLikes: { dispose: () => void }[]): Disposable {
    return {
      dispose: () => {
        for (const disposable of disposableLikes) {
          disposable.dispose();
        }
      },
    };
  }
}

export interface Command {
  id: string;
  handler: (...args: unknown[]) => unknown;
}

export interface TextEditor {
  document: TextDocument;
  selection: Selection;
  selections: Selection[];
  edit(callback: (editBuilder: TextEditorEdit) => void): Promise<boolean>;
}

export interface TextDocument {
  uri: string;
  fileName: string;
  languageId: string;
  version: number;
  isDirty: boolean;
  isUntitled: boolean;
  lineCount: number;
  getText(): string;
  lineAt(line: number): TextLine;
  offsetAt(position: Position): number;
  positionAt(offset: number): Position;
}

export interface TextLine {
  lineNumber: number;
  text: string;
  range: Range;
  rangeExcludingWhitespace: Range;
  isEmptyOrWhitespace: boolean;
}

export interface TextEditorEdit {
  replace(location: Position | Range | Selection, value: string): void;
  insert(location: Position, value: string): void;
  delete(location: Range | Selection): void;
  setEndOfLine(endOfLine: EndOfLine): void;
}

export enum EndOfLine {
  LF = 1,
  CRLF = 2,
}

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Selection extends Range {
  anchor: Position;
  active: Position;
  isEmpty: boolean;
  isReversed: boolean;
}

export interface WorkspaceFolder {
  uri: string;
  name: string;
  index: number;
}

export interface Terminal {
  name: string;
  sendText(text: string, addNewLine?: boolean): void;
  show(preserveFocus?: boolean): void;
  hide(): void;
  dispose(): void;
}

export interface TerminalOptions {
  name?: string;
  shellPath?: string;
  shellArgs?: string[];
  cwd?: string;
  env?: { [key: string]: string | null };
}

export interface OutputChannel {
  name: string;
  append(value: string): void;
  appendLine(value: string): void;
  clear(): void;
  show(preserveFocus?: boolean): void;
  hide(): void;
  dispose(): void;
}

export interface StatusBarAlignment {
  readonly Left: 1;
  readonly Right: 2;
}

export interface StatusBarItem {
  alignment: number;
  text: string;
  tooltip?: string;
  color?: string;
  command?: string;
  show(): void;
  hide(): void;
  dispose(): void;
}

export interface CancellationToken {
  isCancellationRequested: boolean;
  onCancellationRequested(listener: () => void): Disposable;
}

export interface Event<T> {
  (listener: (e: T) => unknown, thisArgs?: unknown, disposables?: Disposable[]): Disposable;
}

export interface FileSystemWatcher extends Disposable {
  onDidCreate: Event<Uri>;
  onDidDelete: Event<Uri>;
  onDidChange: Event<Uri>;
}

export interface Uri {
  scheme: string;
  authority: string;
  path: string;
  query: string;
  fragment: string;
  fsPath: string;
  toString(): string;
}

export interface Diagnostic {
  range: Range;
  message: string;
  severity: DiagnosticSeverity;
  source?: string;
  code?: string | number;
}

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

export interface CompletionItem {
  label: string;
  kind?: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText?: string;
  range?: Range;
}

export enum CompletionItemKind {
  Text = 0,
  Method = 1,
  Function = 2,
  Constructor = 3,
  Field = 4,
  Variable = 5,
  Class = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Unit = 10,
  Value = 11,
  Enum = 12,
  Keyword = 13,
  Snippet = 14,
  Color = 15,
  File = 16,
  Reference = 17,
  Folder = 18,
  EnumMember = 19,
  Constant = 20,
  Struct = 21,
  Event = 22,
  Operator = 23,
  TypeParameter = 24,
}

export interface Hover {
  contents: string | string[];
  range?: Range;
}

export interface ProviderResult<T> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: unknown) => TResult2 | PromiseLike<TResult2>
  ): Promise<TResult1 | TResult2>;
}

export interface CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<CompletionItem[]>;
}

export interface HoverProvider {
  provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Hover>;
}

export interface DefinitionProvider {
  provideDefinition(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Definition>;
}

export interface Definition {
  uri: string;
  range: Range;
}

export interface TreeDataProvider<T> {
  onDidChangeTreeData?: Event<T | undefined | null | void>;
  getTreeItem(element: T): TreeItem | Thenable<TreeItem>;
  getChildren(element?: T): ProviderResult<T[]>;
  getParent?(element: T): ProviderResult<T>;
}

export interface TreeItem {
  label: string;
  id?: string;
  iconPath?: string;
  description?: string;
  tooltip?: string;
  command?: Command;
  collapsibleState?: TreeItemCollapsibleState;
  contextValue?: string;
}

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2,
}

export interface WebviewPanel {
  title: string;
  visible: boolean;
  active: boolean;
  webview: Webview;
  reveal(preserveFocus?: boolean): void;
  dispose(): void;
  onDidDispose: Event<void>;
  onDidChangeViewState: Event<{ visible: boolean; active: boolean }>;
}

export interface Webview {
  html: string;
  options?: WebviewOptions;
  onDidReceiveMessage: Event<unknown>;
  postMessage(message: unknown): Thenable<boolean>;
  asWebviewUri(localResource: Uri): Uri;
}

export interface WebviewOptions {
  enableScripts?: boolean;
  enableForms?: boolean;
  localResourceRoots?: Uri[];
}
