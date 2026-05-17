export interface RepoStatus {
  branch: string;
  ahead: number;
  behind: number;
  files: FileStatusEntry[];
  hasConflicts: boolean;
}

export interface FileStatusEntry {
  path: string;
  status: "modified" | "added" | "deleted" | "untracked" | "renamed" | "conflict";
  staged: boolean;
}

export interface BranchInfo {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  remote?: string;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

export interface FileDiff {
  path: string;
  oldPath?: string;
  hunks: DiffHunk[];
}

export interface BlameLine {
  lineNumber: number;
  author: string;
  email: string;
  timestamp: string;
  shortHash: string;
  message: string;
}

export interface CommitInfo {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  timestamp: string;
  message: string;
  parentHashes: string[];
}

export interface PullResult {
  updated: boolean;
  commitsReceived: number;
}

export interface RemoteInfo {
  name: string;
  url: string;
}

export interface StashInfo {
  index: number;
  message: string;
  author: string;
  timestamp: string;
}

export interface LogOptions {
  limit?: number;
  path?: string;
}

export interface CommitOptions {
  signOff?: boolean;
}
