import { create } from "zustand";
import type { DirectoryEntry, FileEntry } from "@procode/types";

interface FileTreeStore {
  root: DirectoryEntry | null;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  isLoading: boolean;
  setRoot: (root: DirectoryEntry) => void;
  toggleExpand: (path: string) => void;
  selectFile: (path: string) => void;
  setLoading: (isLoading: boolean) => void;
  updateFile: (path: string, entry: Partial<FileEntry>) => void;
  clear: () => void;
}

export const useFileTreeStore = create<FileTreeStore>((set, get) => ({
  root: null,
  expandedPaths: new Set(),
  selectedPath: null,
  isLoading: false,
  setRoot: (root) => set({ root }),
  toggleExpand: (path) => {
    const expandedPaths = new Set(get().expandedPaths);
    if (expandedPaths.has(path)) {
      expandedPaths.delete(path);
    } else {
      expandedPaths.add(path);
    }
    set({ expandedPaths });
  },
  selectFile: (path) => set({ selectedPath: path }),
  setLoading: (isLoading) => set({ isLoading }),
  updateFile: (path, entry) => {
    const { root } = get();
    if (!root) return;

    const updateEntry = (entry: FileEntry): FileEntry => {
      if (entry.path === path) {
        return { ...entry, ...entry };
      }
      if ("children" in entry && Array.isArray(entry.children)) {
        return {
          ...entry,
          children: (entry.children as FileEntry[]).map(updateEntry),
        } as DirectoryEntry;
      }
      return entry;
    };

    set({ root: updateEntry(root) as DirectoryEntry });
  },
  clear: () => set({ root: null, expandedPaths: new Set(), selectedPath: null }),
}));
