import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FileChange } from "@procode/types";
import { FileSystemService } from "./services/file-system.js";
import { SettingsService } from "./services/settings.js";
import { registerTrpcIpcHandlers } from "./ipc/ipc-bridge.js";
import { LSPHost } from "@procode/lsp-host";
import { DAPHost } from "@procode/dap-host";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let fileSystemService: FileSystemService | null = null;
let settingsService: SettingsService | null = null;
let lspHost: LSPHost | null = null;
let dapHost: DAPHost | null = null;

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
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function initializeServices() {
  settingsService = new SettingsService(onSettingsChange);
  await settingsService.initialize();

  fileSystemService = new FileSystemService(onFileChange);
  lspHost = new LSPHost();
  dapHost = new DAPHost();

  registerTrpcIpcHandlers(fileSystemService, settingsService, lspHost, dapHost);
}

app.whenReady().then(async () => {
  await initializeServices();
  createWindow();

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

  if (process.platform !== "darwin") {
    app.quit();
  }
});
