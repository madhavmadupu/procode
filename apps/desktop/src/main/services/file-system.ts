import fs from "node:fs/promises";
import path from "node:path";
import { watch, type FSWatcher } from "node:fs";
import { debounce } from "@procode/utils";
import type { FileEntry, DirectoryEntry, FileChange } from "@procode/types";

const EXCLUDED_DIRS = ["node_modules", ".git", "dist", "build", "target", ".turbo"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class FileSystemService {
  private workspaceRoot: string | null = null;
  private watcher: FSWatcher | null = null;
  private onFileChange: ((change: FileChange) => void) | null = null;

  constructor(onFileChange?: (change: FileChange) => void) {
    this.onFileChange = onFileChange;
  }

  async openFolder(folderPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const stat = await fs.stat(folderPath);
      if (!stat.isDirectory()) {
        return { success: false, error: "Path is not a directory" };
      }

      this.workspaceRoot = path.resolve(folderPath);
      this.startWatcher();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to open folder",
      };
    }
  }

  getWorkspaceRoot(): string | null {
    return this.workspaceRoot;
  }

  async readDirectory(dirPath: string): Promise<DirectoryEntry> {
    const resolvedPath = this.resolvePath(dirPath);
    const entries = await fs.readdir(resolvedPath, { withFileTypes: true });

    const children: FileEntry[] = [];

    for (const entry of entries) {
      if (entry.isDirectory() && EXCLUDED_DIRS.includes(entry.name)) {
        continue;
      }

      const fullPath = path.join(resolvedPath, entry.name);
      const stat = await fs.stat(fullPath);

      if (stat.size > MAX_FILE_SIZE && !entry.isDirectory()) {
        continue;
      }

      children.push({
        path: fullPath,
        name: entry.name,
        isDirectory: entry.isDirectory(),
        size: stat.size,
        mtime: stat.mtimeMs,
        languageId: entry.isDirectory() ? undefined : this.getLanguageId(entry.name),
      });
    }

    return {
      path: resolvedPath,
      name: path.basename(resolvedPath),
      isDirectory: true,
      size: 0,
      mtime: (await fs.stat(resolvedPath)).mtimeMs,
      children,
    };
  }

  async readFile(filePath: string): Promise<string> {
    const resolvedPath = this.resolvePath(filePath);
    return fs.readFile(resolvedPath, "utf-8");
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const resolvedPath = this.resolvePath(filePath);
    await fs.writeFile(resolvedPath, content, "utf-8");
  }

  async stat(filePath: string) {
    const resolvedPath = this.resolvePath(filePath);
    return fs.stat(resolvedPath);
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      await fs.access(resolvedPath);
      return true;
    } catch {
      return false;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const resolvedPath = this.resolvePath(filePath);
    await fs.unlink(resolvedPath);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const resolvedOld = this.resolvePath(oldPath);
    const resolvedNew = this.resolvePath(newPath);
    await fs.rename(resolvedOld, resolvedNew);
  }

  async createFile(dirPath: string, name: string): Promise<string> {
    const resolvedDir = this.resolvePath(dirPath);
    const fullPath = path.join(resolvedDir, name);
    await fs.writeFile(fullPath, "", "utf-8");
    return fullPath;
  }

  async createFolder(dirPath: string, name: string): Promise<string> {
    const resolvedDir = this.resolvePath(dirPath);
    const fullPath = path.join(resolvedDir, name);
    await fs.mkdir(fullPath, { recursive: true });
    return fullPath;
  }

  async deletePath(targetPath: string, recursive: boolean): Promise<void> {
    const resolved = this.resolvePath(targetPath);
    const stat = await fs.stat(resolved);
    if (stat.isDirectory() && recursive) {
      await fs.rm(resolved, { recursive: true, force: true });
    } else if (stat.isDirectory()) {
      await fs.rmdir(resolved);
    } else {
      await fs.unlink(resolved);
    }
  }

  async move(sourcePath: string, targetFolderPath: string): Promise<string> {
    const resolvedSource = this.resolvePath(sourcePath);
    const resolvedTarget = this.resolvePath(targetFolderPath);
    const name = path.basename(sourcePath);
    const newPath = path.join(resolvedTarget, name);
    await fs.rename(resolvedSource, newPath);
    return newPath;
  }

  async copyPath(targetPath: string): Promise<string> {
    const resolved = this.resolvePath(targetPath);
    return resolved;
  }

  async revealInFinder(targetPath: string): Promise<void> {
    const { shell } = await import("electron");
    const resolved = this.resolvePath(targetPath);
    await shell.openPath(path.dirname(resolved));
  }

  private resolvePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    if (!this.workspaceRoot) {
      throw new Error("No workspace open");
    }
    return path.join(this.workspaceRoot, filePath);
  }

  private getLanguageId(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const languageMap: Record<string, string> = {
      ".ts": "typescript",
      ".tsx": "typescriptreact",
      ".js": "javascript",
      ".jsx": "javascriptreact",
      ".py": "python",
      ".rs": "rust",
      ".go": "go",
      ".java": "java",
      ".c": "c",
      ".cpp": "cpp",
      ".h": "c",
      ".hpp": "cpp",
      ".css": "css",
      ".scss": "scss",
      ".html": "html",
      ".json": "json",
      ".md": "markdown",
      ".yaml": "yaml",
      ".yml": "yaml",
      ".toml": "toml",
      ".xml": "xml",
      ".sql": "sql",
      ".sh": "shell",
      ".bash": "shell",
      ".zsh": "shell",
      ".ps1": "powershell",
    };
    return languageMap[ext] || "plaintext";
  }

  private startWatcher(): void {
    if (!this.workspaceRoot) return;

    this.watcher = watch(this.workspaceRoot, { recursive: true });

    const emitChange = debounce((change: FileChange) => {
      this.onFileChange?.(change);
    }, 800);

    this.watcher.on("change", (eventType, filename) => {
      if (!filename) return;

      const type = eventType === "rename" ? "created" : "modified";
      emitChange({
        type,
        path: path.join(this.workspaceRoot!, filename),
        timestamp: Date.now(),
      });
    });
  }

  stopWatcher(): void {
    this.watcher?.close();
    this.watcher = null;
  }
}
