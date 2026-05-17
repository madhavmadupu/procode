import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FileChange } from "@procode/types";
import { FileSystemService } from "./services/file-system.js";
import { SettingsService } from "./services/settings.js";
import { registerTrpcIpcHandlers } from "./ipc/ipc-bridge.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let fileSystemService: FileSystemService | null = null;
let settingsService: SettingsService | null = null;

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

  registerTrpcIpcHandlers(fileSystemService, settingsService);
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

app.on("window-all-closed", () => {
  fileSystemService?.stopWatcher();
  settingsService?.dispose();

  if (process.platform !== "darwin") {
    app.quit();
  }
});
