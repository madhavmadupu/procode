import { create } from "zustand";
import type { WorkspaceState } from "@procode/types";
import { trpc } from "../lib/trpc";

interface WorkspaceStore {
  rootPath: string | null;
  workspaceName: string | null;
  state: WorkspaceState;
  error: string | null;
  setWorkspace: (rootPath: string) => void;
  setState: (state: WorkspaceState) => void;
  setError: (error: string | null) => void;
  clearWorkspace: () => void;
  rehydrate: (rootPath: string, name: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  rootPath: null,
  workspaceName: null,
  state: "idle",
  error: null,
  setWorkspace: (rootPath) => {
    const name = rootPath.split(/[\\/]/).pop() ?? rootPath;
    trpc.workspace.setLastOpened({ rootPath, name }).catch(() => {});
    set({ rootPath, workspaceName: name, state: "ready", error: null });
  },
  setState: (state) => set({ state }),
  setError: (error) => set({ error, state: "error" }),
  clearWorkspace: () => {
    trpc.workspace.clearLastOpened().catch(() => {});
    set({ rootPath: null, workspaceName: null, state: "idle", error: null });
  },
  rehydrate: (rootPath, name) => set({ rootPath, workspaceName: name, state: "ready", error: null }),
}));
