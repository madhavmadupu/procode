import { create } from "zustand";
import { trpc } from "../lib/trpc";

export type WizardStep = "welcome" | "workspace" | "ai-setup" | "done";

interface FirstRunStore {
  hasCompletedOnboarding: boolean;
  currentStep: WizardStep;
  workspacePath: string;
  aiProvider: "ollama" | "openai" | "anthropic" | "opencode" | "none";
  aiApiKey: string;
  aiModel: string;
  isInitialized: boolean;
  setCompleted: (completed: boolean) => void;
  setStep: (step: WizardStep) => void;
  setWorkspacePath: (path: string) => void;
  setAiProvider: (provider: "ollama" | "openai" | "anthropic" | "opencode" | "none") => void;
  setAiApiKey: (key: string) => void;
  setAiModel: (model: string) => void;
  reset: () => void;
  initialize: () => Promise<void>;
}

export const useFirstRunStore = create<FirstRunStore>((set, get) => ({
  hasCompletedOnboarding: false,
  currentStep: "welcome",
  workspacePath: "",
  aiProvider: "ollama",
  aiApiKey: "",
  aiModel: "qwen2.5-coder:7b",
  isInitialized: false,
  setCompleted: (completed) => set({ hasCompletedOnboarding: completed }),
  setStep: (step) => set({ currentStep: step }),
  setWorkspacePath: (path) => set({ workspacePath: path }),
  setAiProvider: (provider) => set({ aiProvider: provider }),
  setAiApiKey: (key) => set({ aiApiKey: key }),
  setAiModel: (model) => set({ aiModel: model }),
  reset: () => set({
    hasCompletedOnboarding: false,
    currentStep: "welcome",
    workspacePath: "",
    aiProvider: "ollama",
    aiApiKey: "",
    aiModel: "qwen2.5-coder:7b",
  }),
  initialize: async () => {
    if (get().isInitialized) return;

    try {
      const lastWorkspace = await trpc.workspace.getLastOpened();
      if (lastWorkspace) {
        set({
          hasCompletedOnboarding: true,
          isInitialized: true,
        });
      } else {
        set({ isInitialized: true });
      }
    } catch {
      set({ isInitialized: true });
    }
  },
}));
