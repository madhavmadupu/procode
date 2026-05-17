import type {
  RepoStatus,
  FileDiff,
  BranchInfo,
  BlameLine,
  CommitInfo,
  PullResult,
  RemoteInfo,
  StashInfo,
  LogOptions,
  CommitOptions,
} from "@procode/types";

declare global {
  interface Window {
    procodeNative: {
      gitStatus: (repoPath: string) => string;
      gitStage: (repoPath: string, paths: string[]) => void;
      gitUnstage: (repoPath: string, paths: string[]) => void;
      gitDiscard: (repoPath: string, paths: string[]) => void;
      gitDiffUnstaged: (repoPath: string, path: string) => string;
      gitDiffStaged: (repoPath: string, path: string) => string;
      gitDiffCommits: (repoPath: string, from: string, to: string) => string;
      gitCommit: (repoPath: string, message: string, signOff: boolean) => string;
      gitAmend: (repoPath: string, message?: string) => string;
      gitBranchList: (repoPath: string) => string;
      gitBranchCreate: (repoPath: string, name: string, from?: string) => void;
      gitBranchCheckout: (repoPath: string, name: string) => void;
      gitBranchDelete: (repoPath: string, name: string, force: boolean) => void;
      gitBranchCurrent: (repoPath: string) => string;
      gitBlame: (repoPath: string, path: string) => string;
      gitLog: (repoPath: string, limit: number, path?: string) => string;
      gitFetch: (repoPath: string, remote?: string) => void;
      gitPull: (repoPath: string) => string;
      gitPush: (repoPath: string, remote: string, branch: string) => void;
      gitRemoteList: (repoPath: string) => string;
      gitStashPush: (repoPath: string, message?: string) => void;
      gitStashPop: (repoPath: string, index: number) => void;
      gitStashList: (repoPath: string) => string;
      gitStashDrop: (repoPath: string, index: number) => void;
    };
  }
}

export class GitEngine {
  constructor(private readonly workspaceRoot: string) {}

  async getStatus(): Promise<RepoStatus> {
    const result = window.procodeNative.gitStatus(this.workspaceRoot);
    return JSON.parse(result);
  }

  async stageFiles(paths: string[]): Promise<void> {
    window.procodeNative.gitStage(this.workspaceRoot, paths);
  }

  async unstageFiles(paths: string[]): Promise<void> {
    window.procodeNative.gitUnstage(this.workspaceRoot, paths);
  }

  async discardChanges(paths: string[]): Promise<void> {
    window.procodeNative.gitDiscard(this.workspaceRoot, paths);
  }

  async getDiff(path: string, staged: boolean): Promise<FileDiff> {
    const result = staged
      ? window.procodeNative.gitDiffStaged(this.workspaceRoot, path)
      : window.procodeNative.gitDiffUnstaged(this.workspaceRoot, path);
    return JSON.parse(result);
  }

  async commit(message: string, options?: CommitOptions): Promise<string> {
    return window.procodeNative.gitCommit(
      this.workspaceRoot,
      message,
      options?.signOff ?? false,
    );
  }

  async amend(message?: string): Promise<string> {
    return window.procodeNative.gitAmend(this.workspaceRoot, message);
  }

  async getBranches(): Promise<BranchInfo[]> {
    const result = window.procodeNative.gitBranchList(this.workspaceRoot);
    return JSON.parse(result);
  }

  async getCurrentBranch(): Promise<string> {
    return window.procodeNative.gitBranchCurrent(this.workspaceRoot);
  }

  async createBranch(name: string, from?: string): Promise<void> {
    window.procodeNative.gitBranchCreate(this.workspaceRoot, name, from);
  }

  async checkoutBranch(name: string): Promise<void> {
    window.procodeNative.gitBranchCheckout(this.workspaceRoot, name);
  }

  async deleteBranch(name: string, force?: boolean): Promise<void> {
    window.procodeNative.gitBranchDelete(this.workspaceRoot, name, force ?? false);
  }

  async getBlame(path: string): Promise<BlameLine[]> {
    const result = window.procodeNative.gitBlame(this.workspaceRoot, path);
    return JSON.parse(result);
  }

  async getLog(options?: LogOptions): Promise<CommitInfo[]> {
    const result = window.procodeNative.gitLog(
      this.workspaceRoot,
      options?.limit ?? 50,
      options?.path,
    );
    return JSON.parse(result);
  }

  async fetch(remote?: string): Promise<void> {
    window.procodeNative.gitFetch(this.workspaceRoot, remote);
  }

  async pull(): Promise<PullResult> {
    const result = window.procodeNative.gitPull(this.workspaceRoot);
    return JSON.parse(result);
  }

  async push(remote: string, branch: string): Promise<void> {
    window.procodeNative.gitPush(this.workspaceRoot, remote, branch);
  }

  async getRemotes(): Promise<RemoteInfo[]> {
    const result = window.procodeNative.gitRemoteList(this.workspaceRoot);
    return JSON.parse(result);
  }

  async stashPush(message?: string): Promise<void> {
    window.procodeNative.gitStashPush(this.workspaceRoot, message);
  }

  async stashPop(index?: number): Promise<void> {
    window.procodeNative.gitStashPop(this.workspaceRoot, index ?? 0);
  }

  async stashList(): Promise<StashInfo[]> {
    const result = window.procodeNative.gitStashList(this.workspaceRoot);
    return JSON.parse(result);
  }

  async stashDrop(index: number): Promise<void> {
    window.procodeNative.gitStashDrop(this.workspaceRoot, index);
  }
}
