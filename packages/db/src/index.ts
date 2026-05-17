import Database from "better-sqlite3";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

export interface WorkspaceRecord {
  id: string;
  rootPath: string;
  name: string;
  lastOpened: number;
  state: "idle" | "indexing" | "ready" | "error";
  createdAt: number;
}

export interface SettingsCacheRecord {
  key: string;
  value: string;
  scope: "global" | "workspace";
  workspacePath: string | null;
  updatedAt: number;
}

export interface FileHistoryRecord {
  id: string;
  workspacePath: string;
  filePath: string;
  content: string;
  savedAt: number;
}

const PROCODE_DIR = path.join(os.homedir(), ".procode");
const DB_PATH = path.join(PROCODE_DIR, "procode.db");

export class ProCodeDB {
  private db: Database.Database;

  constructor(dbPath: string = DB_PATH) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");

    this.initializeTables();
  }

  private initializeTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        root_path TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        last_opened INTEGER NOT NULL,
        state TEXT NOT NULL DEFAULT 'idle',
        created_at INTEGER NOT NULL
      );

      ALTER TABLE workspaces ADD COLUMN name TEXT NOT NULL DEFAULT '';

      CREATE TABLE IF NOT EXISTS settings_cache (
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        scope TEXT NOT NULL CHECK(scope IN ('global', 'workspace')),
        workspace_path TEXT,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (key, scope, workspace_path)
      );

      CREATE TABLE IF NOT EXISTS file_history (
        id TEXT PRIMARY KEY,
        workspace_path TEXT NOT NULL,
        file_path TEXT NOT NULL,
        content TEXT NOT NULL,
        saved_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_workspaces_last_opened ON workspaces(last_opened DESC);
      CREATE INDEX IF NOT EXISTS idx_file_history_workspace ON file_history(workspace_path, file_path);
      CREATE INDEX IF NOT EXISTS idx_settings_cache_scope ON settings_cache(scope, workspace_path);
    `);
  }

  // Workspace operations
  upsertWorkspace(rootPath: string, name?: string): WorkspaceRecord {
    const id = `ws-${Buffer.from(rootPath).toString("base64url")}`;
    const now = Date.now();
    const folderName = name ?? path.basename(rootPath);

    const stmt = this.db.prepare(`
      INSERT INTO workspaces (id, root_path, name, last_opened, state, created_at)
      VALUES (@id, @rootPath, @name, @lastOpened, @state, @createdAt)
      ON CONFLICT(root_path) DO UPDATE SET
        last_opened = @lastOpened,
        state = @state,
        name = @name
      RETURNING *
    `);

    const record = stmt.get({
      id,
      rootPath,
      name: folderName,
      lastOpened: now,
      state: "idle",
      createdAt: now,
    }) as WorkspaceRecord;

    return record;
  }

  getWorkspace(rootPath: string): WorkspaceRecord | null {
    const stmt = this.db.prepare("SELECT * FROM workspaces WHERE root_path = ?");
    return (stmt.get(rootPath) as WorkspaceRecord) || null;
  }

  getRecentWorkspaces(limit: number = 10): WorkspaceRecord[] {
    const stmt = this.db.prepare(
      "SELECT * FROM workspaces ORDER BY last_opened DESC LIMIT ?",
    );
    return stmt.all(limit) as WorkspaceRecord[];
  }

  getLastOpened(): WorkspaceRecord | null {
    const stmt = this.db.prepare(
      "SELECT * FROM workspaces ORDER BY last_opened DESC LIMIT 1",
    );
    return (stmt.get() as WorkspaceRecord) || null;
  }

  clearLastOpened(): void {
    this.db.exec("DELETE FROM workspaces");
  }

  updateWorkspaceState(rootPath: string, state: WorkspaceRecord["state"]): void {
    const stmt = this.db.prepare(
      "UPDATE workspaces SET state = ? WHERE root_path = ?",
    );
    stmt.run(state, rootPath);
  }

  deleteWorkspace(rootPath: string): void {
    const stmt = this.db.prepare("DELETE FROM workspaces WHERE root_path = ?");
    stmt.run(rootPath);

    const settingsStmt = this.db.prepare(
      "DELETE FROM settings_cache WHERE workspace_path = ?",
    );
    settingsStmt.run(rootPath);

    const historyStmt = this.db.prepare(
      "DELETE FROM file_history WHERE workspace_path = ?",
    );
    historyStmt.run(rootPath);
  }

  // Settings cache operations
  cacheSetting(
    key: string,
    value: string,
    scope: "global" | "workspace",
    workspacePath: string | null = null,
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO settings_cache (key, value, scope, workspace_path, updated_at)
      VALUES (@key, @value, @scope, @workspacePath, @updatedAt)
      ON CONFLICT(key, scope, workspace_path) DO UPDATE SET
        value = @value,
        updated_at = @updatedAt
    `);

    stmt.run({
      key,
      value,
      scope,
      workspacePath,
      updatedAt: Date.now(),
    });
  }

  getCachedSetting(
    key: string,
    scope: "global" | "workspace",
    workspacePath: string | null = null,
  ): string | null {
    const stmt = this.db.prepare(
      "SELECT value FROM settings_cache WHERE key = ? AND scope = ? AND workspace_path IS ?",
    );
    const result = stmt.get(key, scope, workspacePath) as SettingsCacheRecord | undefined;
    return result?.value || null;
  }

  getAllCachedSettings(
    scope: "global" | "workspace",
    workspacePath: string | null = null,
  ): SettingsCacheRecord[] {
    const stmt = this.db.prepare(
      "SELECT * FROM settings_cache WHERE scope = ? AND workspace_path IS ?",
    );
    return stmt.all(scope, workspacePath) as SettingsCacheRecord[];
  }

  deleteCachedSetting(
    key: string,
    scope: "global" | "workspace",
    workspacePath: string | null = null,
  ): void {
    const stmt = this.db.prepare(
      "DELETE FROM settings_cache WHERE key = ? AND scope = ? AND workspace_path IS ?",
    );
    stmt.run(key, scope, workspacePath);
  }

  // File history operations
  saveFileHistory(
    workspacePath: string,
    filePath: string,
    content: string,
  ): FileHistoryRecord {
    const id = `fh-${Date.now()}-${Buffer.from(filePath).toString("base64url")}`;

    const stmt = this.db.prepare(`
      INSERT INTO file_history (id, workspace_path, file_path, content, saved_at)
      VALUES (@id, @workspacePath, @filePath, @content, @savedAt)
      RETURNING *
    `);

    return stmt.run({
      id,
      workspacePath,
      filePath,
      content,
      savedAt: Date.now(),
    }) as unknown as FileHistoryRecord;
  }

  getFileHistory(workspacePath: string, filePath: string, limit: number = 10): FileHistoryRecord[] {
    const stmt = this.db.prepare(
      "SELECT * FROM file_history WHERE workspace_path = ? AND file_path = ? ORDER BY saved_at DESC LIMIT ?",
    );
    return stmt.all(workspacePath, filePath, limit) as FileHistoryRecord[];
  }

  // Database maintenance
  vacuum(): void {
    this.db.exec("VACUUM");
  }

  close(): void {
    this.db.close();
  }

  // Expose raw database for advanced operations
  getRaw(): Database.Database {
    return this.db;
  }
}
