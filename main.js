const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

let mainWindow;
let serverProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1800,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // Secured
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("index.html");
}

// Function to read files recursively from a directory
function getFilesRecursively(dir) {
  const files = fs.readdirSync(dir);
  let result = [];

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      result = result.concat(getFilesRecursively(fullPath));
    } else {
      result.push(fullPath);
    }
  });

  return result;
}

// Fetch all files in the server directory
async function getServerFiles() {
  const serverDir = "D:\\sigmaServer";
  console.log(`Fetching files from: ${serverDir}`);

  const categories = {
    logs: [],
    mods: [],
    "user data": [],
  };

  function filterFiles(dir) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursively process logs, mods, and user data directories
        if (
          file === "logs" ||
          file === "mods" ||
          file === "world" ||
          file === "playerdata"
        ) {
          filterFiles(fullPath);
        }
      } else {
        if (
          fullPath.includes("\\logs\\") &&
          (file.endsWith(".log") || file.endsWith(".gz"))
        ) {
          categories.logs.push({ name: file, path: fullPath });
        } else if (fullPath.includes("\\mods\\") && file.endsWith(".jar")) {
          categories.mods.push({ name: file, path: fullPath });
        } else if (
          fullPath.includes("\\world\\playerdata\\") ||
          fullPath.includes("\\world\\stats\\") ||
          fullPath.includes("\\world\\advancements\\")
        ) {
          categories["user data"].push({ name: file, path: fullPath });
        }
      }
    });
  }

  filterFiles(serverDir);
  return categories;
}

// Read file content
ipcMain.handle("read-file", async (event, filePath) => {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error("Error reading file:", error);
    return "Error reading file";
  }
});

// Handle IPC events
ipcMain.handle("get-files", async () => {
  return await getServerFiles();
});

// Start server
ipcMain.handle("start-server", () => {
  if (serverProcess) {
    console.log("Server is already running.");
    return;
  }

  serverProcess = spawn("cmd.exe", ["/c", "D:\\startSigmaServer.bat"], {
    detached: true,
    stdio: "ignore",
  });

  serverProcess.unref();
  console.log("Server started.");
});

// Stop server
ipcMain.handle("stop-server", () => {
  if (!serverProcess) {
    console.log("No server running.");
    return;
  }

  serverProcess.kill();
  serverProcess = null;
  console.log("Server stopped.");
});

// Server status
ipcMain.handle("server-status", () => {
  return { running: !!serverProcess };
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
