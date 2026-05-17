import { create } from "zustand";

export type WizardStep = "welcome" | "workspace" | "ai-setup" | "done";

interface FirstRunStore {
  hasCompletedOnboarding: boolean;
  currentStep: WizardStep;
  workspacePath: string;
  aiProvider: "ollama" | "openai" | "anthropic" | "none";
  aiApiKey: string;
  aiModel: string;
  setCompleted: (completed: boolean) => void;
  setStep: (step: WizardStep) => void;
  setWorkspacePath: (path: string) => void;
  setAiProvider: (provider: "ollama" | "openai" | "anthropic" | "none") => void;
  setAiApiKey: (key: string) => void;
  setAiModel: (model: string) => void;
  reset: () => void;
}

export const useFirstRunStore = create<FirstRunStore>((set) => ({
  hasCompletedOnboarding: false,
  currentStep: "welcome",
  workspacePath: "",
  aiProvider: "ollama",
  aiApiKey: "",
  aiModel: "qwen2.5-coder:7b",
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
}));
