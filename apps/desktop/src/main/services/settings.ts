import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { watch, type FSWatcher } from "node:fs";
import type { Settings, SettingsMerge, SettingsLayer } from "@procode/types";
import { debounce } from "@procode/utils";

const GLOBAL_SETTINGS_DIR = path.join(os.homedir(), ".procode", "settings");
const GLOBAL_SETTINGS_FILE = path.join(GLOBAL_SETTINGS_DIR, "settings.json");
const WORKSPACE_SETTINGS_FILE = ".procode/settings.json";

const DEFAULT_SETTINGS: Settings = {
  editor: {
    tabSize: 4,
    insertSpaces: true,
    fontSize: 14,
    theme: "dark",
  },
  ai: {
    provider: "ollama",
    model: "qwen2.5-coder:7b",
    temperature: 0.1,
    maxTokens: 4096,
  },
  git: {
    autoFetch: true,
    autoRefresh: true,
  },
  terminal: {
    shell: "",
    fontSize: 14,
  },
};

export class SettingsService {
  private globalSettings: Partial<Settings> = {};
  private workspaceSettings: Partial<Settings> = {};
  private workspaceRoot: string | null = null;
  private globalWatcher: FSWatcher | null = null;
  private workspaceWatcher: FSWatcher | null = null;
  private onSettingsChange: ((settings: Settings) => void) | null = null;

  constructor(onSettingsChange?: (settings: Settings) => void) {
    this.onSettingsChange = onSettingsChange;
  }

  async initialize(): Promise<void> {
    await this.ensureGlobalSettingsDir();
    await this.loadGlobalSettings();
    this.startGlobalWatcher();
  }

  async setWorkspaceRoot(root: string): Promise<void> {
    this.workspaceRoot = root;
    await this.loadWorkspaceSettings();
    this.startWorkspaceWatcher();
  }

  async getMergedSettings(): Promise<SettingsMerge> {
    const globalLayer: SettingsLayer = {
      scope: "global",
      path: GLOBAL_SETTINGS_FILE,
      settings: this.globalSettings,
      lastModified: (await fs.stat(GLOBAL_SETTINGS_FILE)).mtimeMs,
    };

    let workspaceLayer: SettingsLayer | undefined;
    if (this.workspaceRoot) {
      const workspacePath = path.join(this.workspaceRoot, WORKSPACE_SETTINGS_FILE);
      try {
        const stat = await fs.stat(workspacePath);
        workspaceLayer = {
          scope: "workspace",
          path: workspacePath,
          settings: this.workspaceSettings,
          lastModified: stat.mtimeMs,
        };
      } catch {
        // Workspace settings file doesn't exist
      }
    }

    const merged = this.mergeSettings(this.globalSettings, this.workspaceSettings);
    const conflicts = this.findConflicts(this.globalSettings, this.workspaceSettings);

    return {
      global: globalLayer,
      workspace: workspaceLayer,
      merged,
      conflicts,
    };
  }

  async updateSetting(
    key: string,
    value: unknown,
    scope: "global" | "workspace" = "global",
  ): Promise<void> {
    if (scope === "global") {
      this.setNestedValue(this.globalSettings, key, value);
      await this.saveGlobalSettings();
    } else {
      if (!this.workspaceRoot) {
        throw new Error("No workspace open");
      }
      this.setNestedValue(this.workspaceSettings, key, value);
      await this.saveWorkspaceSettings();
    }

    this.onSettingsChange?.(this.getMergedSettingsSync());
  }

  async getGlobalSettings(): Promise<Partial<Settings>> {
    return this.globalSettings;
  }

  async getWorkspaceSettings(): Promise<Partial<Settings>> {
    return this.workspaceSettings;
  }

  async resetSettings(scope?: "global" | "workspace"): Promise<void> {
    if (!scope || scope === "global") {
      this.globalSettings = {};
      await this.saveGlobalSettings();
    }
    if (!scope || scope === "workspace") {
      this.workspaceSettings = {};
      if (this.workspaceRoot) {
        await this.saveWorkspaceSettings();
      }
    }
    this.onSettingsChange?.(this.getMergedSettingsSync());
  }

  private async ensureGlobalSettingsDir(): Promise<void> {
    try {
      await fs.mkdir(GLOBAL_SETTINGS_DIR, { recursive: true });
      if (!(await this.fileExists(GLOBAL_SETTINGS_FILE))) {
        await fs.writeFile(GLOBAL_SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
      }
    } catch (error) {
      console.error("Failed to create global settings directory:", error);
    }
  }

  private async loadGlobalSettings(): Promise<void> {
    try {
      const content = await fs.readFile(GLOBAL_SETTINGS_FILE, "utf-8");
      this.globalSettings = JSON.parse(content);
    } catch {
      this.globalSettings = {};
    }
  }

  private async loadWorkspaceSettings(): Promise<void> {
    if (!this.workspaceRoot) return;

    const workspacePath = path.join(this.workspaceRoot, WORKSPACE_SETTINGS_FILE);
    try {
      const content = await fs.readFile(workspacePath, "utf-8");
      this.workspaceSettings = JSON.parse(content);
    } catch {
      this.workspaceSettings = {};
    }
  }

  private async saveGlobalSettings(): Promise<void> {
    await fs.writeFile(GLOBAL_SETTINGS_FILE, JSON.stringify(this.globalSettings, null, 2));
  }

  private async saveWorkspaceSettings(): Promise<void> {
    if (!this.workspaceRoot) return;

    const workspacePath = path.join(this.workspaceRoot, WORKSPACE_SETTINGS_FILE);
    await fs.writeFile(workspacePath, JSON.stringify(this.workspaceSettings, null, 2));
  }

  private startGlobalWatcher(): void {
    this.globalWatcher = watch(GLOBAL_SETTINGS_DIR, { recursive: false });

    const reload = debounce(async () => {
      await this.loadGlobalSettings();
      this.onSettingsChange?.(this.getMergedSettingsSync());
    }, 800);

    this.globalWatcher.on("change", reload);
  }

  private startWorkspaceWatcher(): void {
    if (!this.workspaceRoot) return;

    const workspaceSettingsDir = path.join(this.workspaceRoot, ".procode");

    try {
      this.workspaceWatcher = watch(workspaceSettingsDir, { recursive: false });

      const reload = debounce(async () => {
        await this.loadWorkspaceSettings();
        this.onSettingsChange?.(this.getMergedSettingsSync());
      }, 800);

      this.workspaceWatcher.on("change", reload);
    } catch {
      // .procode directory doesn't exist yet
    }
  }

  private mergeSettings(global: Partial<Settings>, workspace: Partial<Settings>): Settings {
    return {
      editor: { ...DEFAULT_SETTINGS.editor, ...global.editor, ...workspace.editor },
      ai: { ...DEFAULT_SETTINGS.ai, ...global.ai, ...workspace.ai },
      git: { ...DEFAULT_SETTINGS.git, ...global.git, ...workspace.git },
      terminal: { ...DEFAULT_SETTINGS.terminal, ...global.terminal, ...workspace.terminal },
    };
  }

  private getMergedSettingsSync(): Settings {
    return this.mergeSettings(this.globalSettings, this.workspaceSettings);
  }

  private findConflicts(global: Partial<Settings>, workspace: Partial<Settings>): string[] {
    const conflicts: string[] = [];

    const checkSection = (section: keyof Settings) => {
      const globalSection = global[section];
      const workspaceSection = workspace[section];
      if (globalSection && workspaceSection) {
        for (const key of Object.keys(workspaceSection)) {
          if (key in globalSection) {
            conflicts.push(`${section}.${key}`);
          }
        }
      }
    };

    checkSection("editor");
    checkSection("ai");
    checkSection("git");
    checkSection("terminal");

    return conflicts;
  }

  private setNestedValue(obj: Record<string, unknown>, key: string, value: unknown): void {
    const parts = key.split(".");
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  dispose(): void {
    this.globalWatcher?.close();
    this.workspaceWatcher?.close();
  }
}
