import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FileChange } from "@procode/types";
import { FileSystemService } from "./services/file-system.js";
import { SettingsService } from "./services/settings.js";
import { registerTrpcIpcHandlers } from "./ipc/ipc-bridge.js";
import { LSPHost } from "@procode/lsp-host";
import { DAPHost } from "@procode/dap-host";
import { TerminalHost } from "@procode/terminal";
import { ExtensionHost } from "@procode/extension-api";
import { ProCodeDB } from "@procode/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let fileSystemService: FileSystemService | null = null;
let settingsService: SettingsService | null = null;
let lspHost: LSPHost | null = null;
let dapHost: DAPHost | null = null;
let terminalHost: TerminalHost | null = null;
let extensionHost: ExtensionHost | null = null;
let db: ProCodeDB | null = null;

function onFileChange(change: FileChange) {
  mainWindow?.webContents.send("file-change", change);
}

function onSettingsChange(settings: unknown) {
  mainWindow?.webContents.send("settings-change", settings);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, "../renderer/index.html");
    console.log("Loading renderer from:", indexPath);
    mainWindow.loadFile(indexPath);
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function initializeServices() {
  db = new ProCodeDB();
  settingsService = new SettingsService(onSettingsChange);
  await settingsService.initialize();

  fileSystemService = new FileSystemService(onFileChange);
  lspHost = new LSPHost();
  dapHost = new DAPHost();
  terminalHost = new TerminalHost();
  extensionHost = new ExtensionHost();
}

async function getLastWorkspace(): Promise<{ rootPath: string; name: string } | null> {
  const last = db?.getLastOpened();
  if (!last) return null;
  return { rootPath: last.rootPath, name: last.name };
}

app.whenReady().then(async () => {
  ipcMain.handle("open-folder-dialog", async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openDirectory"],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle("get-last-workspace", async () => {
    return getLastWorkspace();
  });

  await initializeServices();
  createWindow();

  if (mainWindow) {
    registerTrpcIpcHandlers(mainWindow, fileSystemService!, settingsService!, lspHost!, dapHost!, terminalHost!, extensionHost!, db!);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", async () => {
  fileSystemService?.stopWatcher();
  settingsService?.dispose();
  await lspHost?.stopAll();
  await dapHost?.stop();
  terminalHost?.killAll();
  extensionHost?.deactivateAll();
  db?.close();

  if (process.platform !== "darwin") {
    app.quit();
  }
});
