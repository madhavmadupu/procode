import { create } from 'zustand';
import { trpc } from '../lib/trpc.js';

interface AgentTask {
  id: string;
  role: string;
  description: string;
  status: 'pending' | 'running' | 'blocked' | 'completed' | 'failed' | 'cancelled';
  result?: string;
  error?: string;
  createdAt: number;
}

interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
}

interface AiState {
  provider: string | null;
  model: string | null;
  isHealthy: boolean;
  healthError: string | null;
  tasks: AgentTask[];
  activeTask: AgentTask | null;
  chatMessages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  searchResults: Array<{ chunk: any; score: number; source: string }>;
  setProvider: (provider: string, model: string) => void;
  checkHealth: () => Promise<void>;
  configureProvider: (config: { provider: string; model: string; apiKey?: string; baseUrl?: string }) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  executeTask: (request: string, context: string[]) => Promise<void>;
  searchCodebase: (query: string) => Promise<void>;
  clearChat: () => void;
  cancelTask: (taskId: string) => void;
}

export const useAiStore = create<AiState>((set, get) => ({
  provider: null,
  model: null,
  isHealthy: false,
  healthError: null,
  tasks: [],
  activeTask: null,
  chatMessages: [],
  isLoading: false,
  error: null,
  searchResults: [],

  setProvider: (provider, model) => {
    set({ provider, model });
  },

  checkHealth: async () => {
    try {
      const status = await trpc.ai.checkHealth();
      set({ isHealthy: status.healthy, healthError: status.error || null });
    } catch (error) {
      set({ isHealthy: false, healthError: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  configureProvider: async (config) => {
    set({ isLoading: true, error: null });
    try {
      const result = await trpc.ai.configureProvider(config);
      set({
        provider: config.provider,
        model: config.model,
        isLoading: false,
      });
      get().checkHealth();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to configure provider',
        isLoading: false,
      });
    }
  },

  sendMessage: async (content) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const messages = get().chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await trpc.ai.chat({
        messages: [...messages, { role: 'user', content }],
      });

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response.choices[0]?.message?.content || '',
        timestamp: Date.now(),
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send message',
        isLoading: false,
      });
    }
  },

  executeTask: async (request, context) => {
    set({ isLoading: true, error: null });
    try {
      const result = await trpc.ai.executeAgentTask({ request, context });
      const task: AgentTask = {
        id: result.taskId,
        role: 'coder',
        description: request,
        status: 'running',
        createdAt: Date.now(),
      };
      set((state) => ({
        tasks: [...state.tasks, task],
        activeTask: task,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to execute task',
        isLoading: false,
      });
    }
  },

  searchCodebase: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const results = await trpc.ai.searchCodebase({ query });
      set({ searchResults: results, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Search failed',
        isLoading: false,
      });
    }
  },

  clearChat: () => {
    set({ chatMessages: [] });
  },

  cancelTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'cancelled' as const } : t
      ),
      activeTask: state.activeTask?.id === taskId ? null : state.activeTask,
    }));
  },
}));
