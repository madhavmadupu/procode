import { create } from "zustand";
import { trpc } from "../lib/trpc";

interface ExtensionInfo {
  name: string;
  displayName: string;
  version: string;
  description?: string;
  isActive: boolean;
}

interface ExtensionStore {
  extensions: ExtensionInfo[];
  commands: string[];
  isLoading: boolean;
  error: string | null;

  loadExtensions: () => Promise<void>;
  loadCommands: () => Promise<void>;
  activateExtension: (name: string) => Promise<void>;
  deactivateExtension: (name: string) => Promise<void>;
  executeCommand: (id: string, args?: unknown[]) => Promise<void>;
}

export const useExtensionStore = create<ExtensionStore>((set) => ({
  extensions: [],
  commands: [],
  isLoading: false,
  error: null,

  loadExtensions: async () => {
    set({ isLoading: true, error: null });
    try {
      const extensions = await trpc.extension.list();
      set({ extensions, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load extensions",
        isLoading: false,
      });
    }
  },

  loadCommands: async () => {
    try {
      const commands = await trpc.extension.getCommands();
      set({ commands });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load commands" });
    }
  },

  activateExtension: async (name) => {
    try {
      await trpc.extension.activate({ name });
      set((state) => ({
        extensions: state.extensions.map((ext) =>
          ext.name === name ? { ...ext, isActive: true } : ext
        ),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to activate extension" });
    }
  },

  deactivateExtension: async (name) => {
    try {
      await trpc.extension.deactivate({ name });
      set((state) => ({
        extensions: state.extensions.map((ext) =>
          ext.name === name ? { ...ext, isActive: false } : ext
        ),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to deactivate extension" });
    }
  },

  executeCommand: async (id, args) => {
    try {
      await trpc.extension.executeCommand({ id, args });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to execute command" });
    }
  },
}));
