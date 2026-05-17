import { create } from "zustand";

interface CommandPaletteStore {
  isOpen: boolean;
  query: string;
  open: () => void;
  close: () => void;
  setQuery: (query: string) => void;
  toggle: () => void;
}

export const useCommandPaletteStore = create<CommandPaletteStore>((set) => ({
  isOpen: false,
  query: "",
  open: () => set({ isOpen: true, query: "" }),
  close: () => set({ isOpen: false, query: "" }),
  setQuery: (query) => set({ query }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen, query: "" })),
}));
