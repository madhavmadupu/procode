export interface FileEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  size: number;
  mtime: number;
  languageId?: string;
}

export interface DirectoryEntry extends FileEntry {
  isDirectory: true;
  children: FileEntry[];
}

export type FileChangeType = "created" | "modified" | "deleted" | "renamed";

export interface FileChange {
  type: FileChangeType;
  path: string;
  oldPath?: string;
  timestamp: number;
}
