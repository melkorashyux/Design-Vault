const { app, BrowserWindow } = require("electron");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

const PORT = 3000;
const URL = `http://localhost:${PORT}`;

let serverProcess;
let mainWindow;

function waitForServer(url, callback) {
  const attempt = () => {
    http
      .get(url, (res) => {
        res.destroy();
        callback();
      })
      .on("error", () => setTimeout(attempt, 300));
  };
  attempt();
}

function startServer() {
  if (!app.isPackaged) {
    // Dev mode: rely on the developer's own Node/npm install.
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
    serverProcess = spawn(npmCmd, ["run", "dev"], {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
      shell: false,
    });
  } else {
    // Packaged mode: run Next's standalone server.js directly using
    // Electron's own embedded Node runtime (ELECTRON_RUN_AS_NODE), so
    // end users don't need Node/npm installed on their machine at all.
    const standaloneDir = path.join(process.resourcesPath, "app", ".next", "standalone");
    const serverScript = path.join(standaloneDir, "server.js");

    serverProcess = spawn(process.execPath, [serverScript], {
      cwd: standaloneDir,
      stdio: "inherit",
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        PORT: String(PORT),
        HOSTNAME: "localhost",
      },
    });
  }

  serverProcess.on("error", (err) => {
    console.error("Failed to start Next.js server:", err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    title: "Visual Brain",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(URL);
}

app.whenReady().then(() => {
  startServer();
  waitForServer(URL, createWindow);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      waitForServer(URL, createWindow);
    }
  });
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});
