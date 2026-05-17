import { create } from 'zustand';
import { trpc } from '../lib/trpc';

interface DebugThread {
  id: number;
  name: string;
}

interface StackFrame {
  id: number;
  name: string;
  source?: { name?: string; path?: string };
  line: number;
  column: number;
}

interface Scope {
  name: string;
  presentationHint?: string;
  variablesReference: number;
  expensive: boolean;
}

interface Variable {
  name: string;
  value: string;
  type?: string;
  variablesReference: number;
  namedVariables?: number;
  indexedVariables?: number;
}

interface DapStore {
  // Session state
  state: 'stopped' | 'starting' | 'running' | 'stopped-debug' | 'error';
  isDebugging: boolean;

  // Threads
  threads: DebugThread[];
  currentThreadId: number | null;

  // Stack trace
  stackFrames: StackFrame[];
  selectedFrameId: number | null;

  // Variables
  scopes: Scope[];
  variables: Map<number, Variable[]>;

  // Breakpoints
  breakpoints: Map<string, { line: number; column?: number; condition?: string; verified: boolean }[]>;

  // Output
  output: { category: string; output: string }[];

  // Actions
  startSession: (adapterPath: string, config: {
    type: 'launch' | 'attach';
    program: string;
    args?: string[];
    cwd?: string;
    env?: { [key: string]: string };
    stopOnEntry?: boolean;
    console?: 'internalConsole' | 'integratedTerminal' | 'externalTerminal';
  }) => Promise<void>;
  stopSession: () => Promise<void>;
  refreshState: () => Promise<void>;

  setBreakpoints: (path: string, breakpoints: { line: number; column?: number; condition?: string; hitCondition?: string; logMessage?: string }[]) => Promise<void>;
  clearBreakpoints: (path: string) => Promise<void>;

  continue: (threadId?: number) => Promise<void>;
  next: (threadId?: number) => Promise<void>;
  stepIn: (threadId?: number) => Promise<void>;
  stepOut: (threadId?: number) => Promise<void>;
  pause: (threadId?: number) => Promise<void>;

  getThreads: () => Promise<void>;
  getStackTrace: (threadId?: number, startFrame?: number, levels?: number) => Promise<void>;
  getScopes: (frameId: number) => Promise<void>;
  getVariables: (variablesReference: number) => Promise<void>;

  evaluate: (expression: string, frameId?: number) => Promise<{ result: string; type?: string; variablesReference: number }>;

  clearOutput: () => void;
  addOutput: (category: string, output: string) => void;
}

export const useDapStore = create<DapStore>((set, get) => ({
  // Initial state
  state: 'stopped',
  isDebugging: false,
  threads: [],
  currentThreadId: null,
  stackFrames: [],
  selectedFrameId: null,
  scopes: [],
  variables: new Map(),
  breakpoints: new Map(),
  output: [],

  // Session actions
  startSession: async (adapterPath: string, config) => {
    set({ state: 'starting' });
    await trpc.dap.startSession({ adapterPath, config });
    await get().refreshState();
    await get().getThreads();
  },

  stopSession: async () => {
    await trpc.dap.stopSession();
    set({
      state: 'stopped',
      isDebugging: false,
      threads: [],
      currentThreadId: null,
      stackFrames: [],
      selectedFrameId: null,
      scopes: [],
      variables: new Map(),
    });
  },

  refreshState: async () => {
    const result = await trpc.dap.getState();
    set({
      state: result.state,
      isDebugging: result.state === 'running' || result.state === 'stopped-debug',
    });
  },

  // Breakpoint actions
  setBreakpoints: async (path: string, breakpoints) => {
    const result = await trpc.dap.setBreakpoints({ path, breakpoints });
    const newBreakpoints = new Map(get().breakpoints);
    newBreakpoints.set(path, breakpoints.map((bp, i) => ({
      ...bp,
      verified: result[i]?.verified ?? false,
    })));
    set({ breakpoints: newBreakpoints });
  },

  clearBreakpoints: async (path: string) => {
    await trpc.dap.clearBreakpoints({ path });
    const newBreakpoints = new Map(get().breakpoints);
    newBreakpoints.delete(path);
    set({ breakpoints: newBreakpoints });
  },

  // Execution control
  continue: async (threadId?: number) => {
    await trpc.dap.continue({ threadId });
    await get().refreshState();
  },

  next: async (threadId?: number) => {
    await trpc.dap.next({ threadId });
    await get().refreshState();
  },

  stepIn: async (threadId?: number) => {
    await trpc.dap.stepIn({ threadId });
    await get().refreshState();
  },

  stepOut: async (threadId?: number) => {
    await trpc.dap.stepOut({ threadId });
    await get().refreshState();
  },

  pause: async (threadId?: number) => {
    await trpc.dap.pause({ threadId });
    await get().refreshState();
  },

  // Threads
  getThreads: async () => {
    const threads = await trpc.dap.getThreads();
    set({ threads: threads ?? [] });
    if (threads && threads.length > 0) {
      set({ currentThreadId: threads[0]?.id ?? null });
    }
  },

  // Stack trace
  getStackTrace: async (threadId?: number, startFrame = 0, levels = 20) => {
    const stackFrames = await trpc.dap.getStackTrace({ threadId, startFrame, levels });
    set({ stackFrames: stackFrames ?? [] });
    if (stackFrames && stackFrames.length > 0) {
      set({ selectedFrameId: stackFrames[0]?.id ?? null });
    }
  },

  // Variables
  getScopes: async (frameId: number) => {
    const scopes = await trpc.dap.getScopes({ frameId });
    set({ scopes: scopes ?? [] });
  },

  getVariables: async (variablesReference: number) => {
    const variables = await trpc.dap.getVariables({ variablesReference });
    const newVariables = new Map(get().variables);
    newVariables.set(variablesReference, variables ?? []);
    set({ variables: newVariables });
  },

  // Evaluate
  evaluate: async (expression: string, frameId?: number) => {
    return await trpc.dap.evaluate({ expression, frameId });
  },

  // Output
  clearOutput: () => set({ output: [] }),
  addOutput: (category: string, output: string) => {
    set({ output: [...get().output, { category, output }] });
  },
}));
