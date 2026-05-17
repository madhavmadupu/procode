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
