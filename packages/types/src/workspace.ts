export interface WorkspaceConfig {
  rootPath: string;
  excludedPaths: string[];
  maxFileSize: number;
}

export type WorkspaceState = "idle" | "indexing" | "ready" | "error";
