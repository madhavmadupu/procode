import { create } from "zustand";
import type { RepoStatus, BranchInfo } from "@procode/types";
import { trpc } from "../lib/trpc";

interface GitStore {
  status: RepoStatus | null;
  currentBranch: string | null;
  branches: BranchInfo[];
  isLoading: boolean;
  error: string | null;
  commitMessage: string;

  refreshStatus: () => Promise<void>;
  stageFiles: (paths: string[]) => Promise<void>;
  unstageFiles: (paths: string[]) => Promise<void>;
  discardChanges: (paths: string[]) => Promise<void>;
  setCommitMessage: (message: string) => void;
  commit: () => Promise<void>;
  checkoutBranch: (name: string) => Promise<void>;
  createBranch: (name: string, from?: string) => Promise<void>;
  deleteBranch: (name: string, force?: boolean) => Promise<void>;
  getLog: (limit?: number, path?: string) => Promise<any[]>;
  getBlame: (path: string) => Promise<any[]>;
  getDiff: (path: string, staged: boolean) => Promise<any>;
}

export const useGitStore = create<GitStore>((set, get) => ({
  status: null,
  currentBranch: null,
  branches: [],
  isLoading: false,
  error: null,
  commitMessage: "",

  refreshStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const status = await trpc.git.status();
      const currentBranch = await trpc.git.currentBranch();
      const branches = await trpc.git.branches();
      set({ status, currentBranch, branches, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to refresh git status",
        isLoading: false,
      });
    }
  },

  stageFiles: async (paths) => {
    set({ isLoading: true, error: null });
    try {
      await trpc.git.stage({ paths });
      await get().refreshStatus();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to stage files",
        isLoading: false,
      });
    }
  },

  unstageFiles: async (paths) => {
    set({ isLoading: true, error: null });
    try {
      await trpc.git.unstage({ paths });
      await get().refreshStatus();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to unstage files",
        isLoading: false,
      });
    }
  },

  discardChanges: async (paths) => {
    set({ isLoading: true, error: null });
    try {
      await trpc.git.discard({ paths });
      await get().refreshStatus();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to discard changes",
        isLoading: false,
      });
    }
  },

  setCommitMessage: (message) => {
    set({ commitMessage: message });
  },

  commit: async () => {
    const { commitMessage } = get();
    if (!commitMessage.trim()) {
      set({ error: "Commit message cannot be empty" });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      await trpc.git.commit({ message: commitMessage });
      set({ commitMessage: "" });
      await get().refreshStatus();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to commit",
        isLoading: false,
      });
    }
  },

  checkoutBranch: async (name) => {
    set({ isLoading: true, error: null });
    try {
      await trpc.git.checkoutBranch({ name });
      await get().refreshStatus();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to checkout branch",
        isLoading: false,
      });
    }
  },

  createBranch: async (name, from) => {
    set({ isLoading: true, error: null });
    try {
      await trpc.git.createBranch({ name, from });
      await get().checkoutBranch(name);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create branch",
        isLoading: false,
      });
    }
  },

  deleteBranch: async (name, force) => {
    set({ isLoading: true, error: null });
    try {
      await trpc.git.deleteBranch({ name, force });
      await get().refreshStatus();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to delete branch",
        isLoading: false,
      });
    }
  },

  getLog: async (limit, path) => {
    try {
      return await trpc.git.log({ limit, path });
    } catch (error) {
      console.error("Failed to get git log:", error);
      return [];
    }
  },

  getBlame: async (path) => {
    try {
      return await trpc.git.blame({ path });
    } catch (error) {
      console.error("Failed to get git blame:", error);
      return [];
    }
  },

  getDiff: async (path, staged) => {
    try {
      return await trpc.git.diff({ path, staged });
    } catch (error) {
      console.error("Failed to get git diff:", error);
      return { path, hunks: [] };
    }
  },
}));
