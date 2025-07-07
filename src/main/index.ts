import { app, shell, BrowserWindow, ipcMain, dialog, Notification } from "electron";
import path, { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { testing } from "./window_action_bar";
import { existsSync, mkdirSync, writeFile, writeFileSync } from "fs";
import { exec } from "child_process";
import { machineId } from "node-machine-id";

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    minWidth: 900,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : { icon }),

    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true, // Ensure that security settings are correctly applied
      allowRunningInsecureContent: false
    },
    icon: icon
  });

  ipcMain.on("window-minimize", () => mainWindow.minimize());
  ipcMain.on("window-toggle-maximize", (event) => {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
      event.reply("window-full-screen", false);
    } else {
      mainWindow.maximize();
      event.reply("window-full-screen", true);
    }
  });
  ipcMain.on("window-close", () => mainWindow.close());

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("Light POS");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  connectIPCMain();

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function connectIPCMain() {
  ipcMain.handle("writeFile", (event, filename, content) => {
    const desktopDir = app.getPath("desktop");
    writeFileSync(path.join(desktopDir, filename), content);
    return `File Saved in ${path.join(desktopDir, filename)}`;
  });

  ipcMain.handle("backupExcel", (event, filename, content) => {
    try {
      const documentDir = app.getPath("documents");
      const backupDir = path.join(documentDir, "Light POS");
      if (!existsSync(backupDir)) {
        mkdirSync(backupDir);
      }
      const filePath = path.join(backupDir, filename);
      writeFileSync(filePath, Buffer.from(content));

      return backupDir;
    } catch (error) {
      return null;
    }
  });

  ipcMain.handle("openInternetSetting", (event) => {
    const platform = process.platform; // Get platform type
    if (platform === "win32") {
      shell.openExternal("ms-settings:network");
    } else if (platform === "darwin") {
      exec("open /System/Library/PreferencePanes/Network.prefPane");
    } else if (platform === "linux") {
      exec("nm-connection-editor", (error) => {
        if (error) {
          console.error(`Error opening network manager: ${error}`);
        }
      });
    } else {
      console.error("Unsupported platform");
    }
  });
  ipcMain.handle("getDeviceId", async (event) => {
    const id = await machineId();
    return id;
  });

  ipcMain.handle("print-receipt", (event, receiptHTML) => {
    // Create a hidden BrowserWindow
    const printWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false, // Keep the window hidden while loading the content
      webPreferences: {
        nodeIntegration: true
      }
    });

    // Load the receipt HTML content into the new window
    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(receiptHTML)}`);

    // Once the window has finished loading, print the content
    printWindow.webContents.on("did-finish-load", () => {
      printWindow.webContents.print({}, (success, errorType) => {
        if (!success) console.error("Print failed:", errorType);
        // Close the window after printing
        printWindow.close();
      });
    });
  });
}
