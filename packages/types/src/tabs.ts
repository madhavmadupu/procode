export interface DocumentState {
  path: string;
  content: string;
  originalContent: string;
  languageId: string;
  isDirty: boolean;
  version: number;
  cursorPosition: { line: number; column: number };
  scrollPosition: { top: number; left: number };
}

export interface Tab {
  id: string;
  path: string;
  name: string;
  isDirty: boolean;
  isActive: boolean;
  pinned: boolean;
}
