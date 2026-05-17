import { create } from "zustand";
import type { EditorConfig } from "@procode/types";

interface EditorStore {
  config: EditorConfig;
  isSidebarOpen: boolean;
  isTerminalOpen: boolean;
  toggleSidebar: () => void;
  toggleTerminal: () => void;
  updateConfig: (config: Partial<EditorConfig>) => void;
  setTheme: (theme: string) => void;
}

const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  tabSize: 4,
  insertSpaces: true,
  wordWrap: "off",
  minimap: { enabled: true },
  fontSize: 14,
  fontFamily: "JetBrains Mono, monospace",
  theme: "dark",
};

export const useEditorStore = create<EditorStore>((set) => ({
  config: DEFAULT_EDITOR_CONFIG,
  isSidebarOpen: true,
  isTerminalOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),
  updateConfig: (config) =>
    set((state) => ({ config: { ...state.config, ...config } })),
  setTheme: (theme) =>
    set((state) => ({ config: { ...state.config, theme } })),
}));
