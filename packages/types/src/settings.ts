export interface Settings {
  editor: {
    tabSize: number;
    insertSpaces: boolean;
    fontSize: number;
    theme: string;
  };
  ai: {
    provider: "ollama" | "anthropic" | "openai";
    model: string;
    temperature: number;
    maxTokens: number;
  };
  git: {
    autoFetch: boolean;
    autoRefresh: boolean;
  };
  terminal: {
    shell: string;
    fontSize: number;
  };
}

export type SettingsScope = "global" | "workspace";

export interface SettingsLayer {
  scope: SettingsScope;
  path: string;
  settings: Partial<Settings>;
  lastModified: number;
}

export interface SettingsMerge {
  global: SettingsLayer;
  workspace?: SettingsLayer;
  merged: Settings;
  conflicts: string[];
}
