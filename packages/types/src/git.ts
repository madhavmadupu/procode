export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  files: GitFileStatus[];
}

export interface GitFileStatus {
  path: string;
  status: "modified" | "added" | "deleted" | "untracked" | "renamed";
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
}

export interface GitDiff {
  path: string;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}
