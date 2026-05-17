import { create } from "zustand";

interface AppError {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  context?: string;
  severity: "error" | "warning" | "info";
}

interface ErrorStore {
  errors: AppError[];
  addError: (error: Omit<AppError, "id" | "timestamp">) => void;
  clearErrors: () => void;
  removeError: (id: string) => void;
}

export const useErrorStore = create<ErrorStore>((set) => ({
  errors: [],

  addError: (error) =>
    set((state) => ({
      errors: [
        ...state.errors,
        {
          ...error,
          id: `error-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Date.now(),
        },
      ],
    })),

  clearErrors: () => set({ errors: [] }),

  removeError: (id) =>
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
    })),
}));
