import { create } from "zustand";
import type { Settings, SettingsMerge } from "@procode/types";

interface SettingsStore {
  settings: Settings | null;
  mergeResult: SettingsMerge | null;
  isLoading: boolean;
  setSettings: (settings: Settings) => void;
  setMergeResult: (mergeResult: SettingsMerge) => void;
  setLoading: (isLoading: boolean) => void;
  updateSetting: (key: string, value: unknown) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  mergeResult: null,
  isLoading: false,
  setSettings: (settings) => set({ settings }),
  setMergeResult: (mergeResult) => set({ mergeResult }),
  setLoading: (isLoading) => set({ isLoading }),
  updateSetting: (key, value) => {
    const { settings } = get();
    if (!settings) return;

    const parts = key.split(".");
    const newSettings = { ...settings };
    let current: any = newSettings;

    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
    set({ settings: newSettings });
  },
}));
