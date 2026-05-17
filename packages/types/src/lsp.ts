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
