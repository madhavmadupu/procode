import { create } from "zustand";
import { trpc } from "../lib/trpc";

interface TerminalSession {
  id: string;
  name: string;
  pid: number;
  rows: number;
  cols: number;
  isRunning: boolean;
}

interface TerminalStore {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  dataCallbacks: Map<string, (data: string) => void>;

  createSession: (options?: { name?: string; cwd?: string }) => Promise<void>;
  killSession: (id: string) => Promise<void>;
  killAll: () => Promise<void>;
  setActiveSession: (id: string | null) => void;
  renameSession: (id: string, name: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  registerDataCallback: (id: string, callback: (data: string) => void) => void;
  unregisterDataCallback: (id: string) => void;
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  isLoading: false,
  error: null,
  dataCallbacks: new Map(),

  createSession: async (options) => {
    set({ isLoading: true, error: null });
    try {
      const session = await trpc.terminal.create(options) as TerminalSession;
      set((state) => ({
        sessions: [...state.sessions, session],
        activeSessionId: session.id,
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to create terminal",
        isLoading: false,
      });
    }
  },

  killSession: async (id) => {
    try {
      await trpc.terminal.kill({ id });
      set((state) => {
        const sessions = state.sessions.filter((s) => s.id !== id);
        const newActive = state.activeSessionId === id
          ? (sessions.length > 0 ? sessions[0]?.id ?? null : null)
          : state.activeSessionId;
        return { sessions, activeSessionId: newActive };
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to kill terminal" });
    }
  },

  killAll: async () => {
    try {
      await trpc.terminal.killAll();
      set({ sessions: [], activeSessionId: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to kill all terminals" });
    }
  },

  setActiveSession: (id) => {
    set({ activeSessionId: id });
  },

  renameSession: async (id, name) => {
    try {
      await trpc.terminal.rename({ id, name });
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, name } : s
        ),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to rename terminal" });
    }
  },

  refreshSessions: async () => {
    try {
      const sessions = await trpc.terminal.list() as TerminalSession[];
      set({ sessions });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to refresh terminals" });
    }
  },

  registerDataCallback: (id, callback) => {
    set((state) => {
      const newCallbacks = new Map(state.dataCallbacks);
      newCallbacks.set(id, callback);
      return { dataCallbacks: newCallbacks };
    });
  },

  unregisterDataCallback: (id) => {
    set((state) => {
      const newCallbacks = new Map(state.dataCallbacks);
      newCallbacks.delete(id);
      return { dataCallbacks: newCallbacks };
    });
  },
}));
