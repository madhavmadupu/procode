import { create } from "zustand";
import type { WorkspaceState } from "@procode/types";

interface WorkspaceStore {
  rootPath: string | null;
  state: WorkspaceState;
  error: string | null;
  setWorkspace: (rootPath: string) => void;
  setState: (state: WorkspaceState) => void;
  setError: (error: string | null) => void;
  clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  rootPath: null,
  state: "idle",
  error: null,
  setWorkspace: (rootPath) => set({ rootPath, state: "ready", error: null }),
  setState: (state) => set({ state }),
  setError: (error) => set({ error, state: "error" }),
  clearWorkspace: () => set({ rootPath: null, state: "idle", error: null }),
}));
