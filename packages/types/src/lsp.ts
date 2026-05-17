export interface LSPConfig {
  serverId: string;
  command: string;
  args: string[];
  filePatterns: string[];
}

export interface Diagnostic {
  uri: string;
  severity: 1 | 2 | 3 | 4;
  message: string;
  range: { start: Position; end: Position };
  source?: string;
  code?: string | number;
}

export interface Completion {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText: string;
  range?: { start: Position; end: Position };
}

export type CompletionItemKind =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20
  | 21 | 22 | 23 | 24 | 25;

export interface Position {
  line: number;
  character: number;
}

export interface HoverResult {
  contents: string | string[];
  range?: { start: Position; end: Position };
}

export interface DefinitionResult {
  uri: string;
  range: { start: Position; end: Position };
}

export interface SymbolInfo {
  name: string;
  kind: SymbolKind;
  uri: string;
  range: { start: Position; end: Position };
  selectionRange?: { start: Position; end: Position };
  children?: SymbolInfo[];
}

export type SymbolKind =
  | 1 // File
  | 2 // Module
  | 3 // Namespace
  | 4 // Package
  | 5 // Class
  | 6 // Method
  | 7 // Property
  | 8 // Field
  | 9 // Constructor
  | 10 // Enum
  | 11 // Interface
  | 12 // Function
  | 13 // Variable
  | 14 // Constant
  | 15 // String
  | 16 // Number
  | 17 // Boolean
  | 18 // Array
  | 19 // Object
  | 20 // Key
  | 21 // Null
  | 22 // EnumMember
  | 23 // Struct
  | 24 // Event
  | 25 // Operator
  | 26; // TypeParameter

export interface WorkspaceSymbolResult {
  name: string;
  kind: SymbolKind;
  uri: string;
  location?: { start: Position; end: Position };
}

export interface RenameResult {
  changes: { [uri: string]: TextEdit[] };
}

export interface TextEdit {
  range: { start: Position; end: Position };
  newText: string;
}

export interface CodeAction {
  title: string;
  kind?: string;
  diagnostics?: Diagnostic[];
  edit?: RenameResult;
  command?: { title: string; command: string; arguments?: unknown[] };
}

export interface SignatureHelpResult {
  signatures: {
    label: string;
    documentation?: string;
    parameters?: { label: string; documentation?: string }[];
  }[];
  activeSignature?: number;
  activeParameter?: number;
}

export interface InlayHintResult {
  position: Position;
  label: string;
  kind?: 'type' | 'parameter' | 'other';
  paddingLeft?: boolean;
  paddingRight?: boolean;
}

export interface SemanticToken {
  line: number;
  startChar: number;
  length: number;
  tokenType: number;
  tokenModifiers: number;
}

export interface LspServerState {
  serverId: string;
  state: 'stopped' | 'starting' | 'running' | 'error';
  rootPath?: string;
}

export interface LspStatus {
  servers: LspServerState[];
  diagnostics: Map<string, Diagnostic[]>;
}
