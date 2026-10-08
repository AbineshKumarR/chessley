import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- C++ engine subprocess management ----------------
let engineProc = null;
let engineRl = null;
let engineQueue = [];

function resolveEnginePath() {
  const exeName = process.platform === "win32" ? "engine.exe" : "engine";
  const devPath = path.join(__dirname, "../native", exeName);
  const packagedPath = path.join(process.resourcesPath || "", "native", exeName);
  if (fs.existsSync(devPath)) return devPath;
  if (fs.existsSync(packagedPath)) return packagedPath;
  return null;
}

function startEngine() {
  const enginePath = resolveEnginePath();
  console.log(`[Main Process] Spawning C++ engine binary at: ${enginePath}`);
  if (!enginePath) {
    console.error("[Main Process Error] C++ engine executable not found (native/engine.exe).");
    return;
  }
  engineProc = spawn(enginePath, [], { stdio: ["pipe", "pipe", "pipe"] });
  console.log(`[Main Process] Subprocess Spawned. PID: ${engineProc.pid}`);

  engineRl = readline.createInterface({ input: engineProc.stdout });
  engineRl.on("line", (line) => {
    const next = engineQueue.shift();
    if (next) next.resolve(line);
  });
  engineProc.on("exit", (code) => {
    console.error(`[Main Process] C++ Engine process exited with code ${code}`);
    engineProc = null; engineRl = null;
    const pending = engineQueue.splice(0);
    pending.forEach((p) => p.reject(new Error("Engine process exited")));
  });
  engineProc.stderr.on("data", (d) => console.error("[Native Engine Stderr]", d.toString()));
}

function sendEngineCommand(line) {
  return new Promise((resolve, reject) => {
    if (!engineProc) { reject(new Error("C++ Native Engine process not running")); return; }
    engineQueue.push({ resolve, reject });
    engineProc.stdin.write(line + "\n");
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: "#09090b",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.webContents.on("console-message", (_event, _level, message) => {
    console.log(message);
  });

  win.loadFile(path.join(__dirname, "../dist/index.html"));
}

ipcMain.handle("engine:search", async (_event, fen, config = {}) => {
  const parts = fen.trim().split(/\s+/);
  while (parts.length < 6) parts.push(parts.length === 4 ? "0" : parts.length === 5 ? "1" : "-");

  const targetDepth = config.targetDepth || 5;
  const timeMs = config.timeMs || 1500;
  const maxEvalLoss = config.maxEvalLoss !== undefined ? config.maxEvalLoss : 0.0;
  const usePST = config.usePST === false ? 0 : 1;
  const useBook = config.useBook === false ? 0 : 1;
  const queenBonus = config.queenBonus ? 1 : 0;

  const cmd = `search ${parts.slice(0, 6).join(" ")} ${targetDepth} ${Math.round(timeMs)} ${maxEvalLoss} ${usePST} ${useBook} ${queenBonus}`;

  console.log(`[Electron IPC -> Native Engine Request]: ${cmd}`);

  const line = await sendEngineCommand(cmd);

  console.log(`[Native Engine -> Electron IPC Response]: ${line}`);

  const tok = line.trim().split(/\s+/);
  let resMap = {};
  for (let i = 0; i < tok.length; i += 2) {
    if (i + 1 < tok.length) {
      resMap[tok[i]] = tok[i + 1];
    }
  }

  const from = tok[1];
  const to = tok[2];
  const promo = tok[3] === "-" ? null : tok[3];
  const score = Number(resMap["score"] || 0);
  const depth = Number(resMap["depth"] || 0);
  const nodes = Number(resMap["nodes"] || 0);
  const elapsedMs = Number(resMap["timems"] || 0);
  const nps = Number(resMap["nps"] || 0);
  const isBook = resMap["isbook"] === "1";
  const err = resMap["err"] || "ok";

  if (tok[0] !== "bestmove" || from === "-" || err !== "ok") {
    return { error: err || "no_move", from: null, to: null };
  }

  return {
    from,
    to,
    promotion: promo,
    score,
    depth,
    nodes,
    timeMs: elapsedMs,
    nps,
    isBook,
    err,
    rawRequest: cmd,
    rawResponse: line,
  };
});

ipcMain.handle("engine:newgame", async () => {
  try { await sendEngineCommand("newgame"); } catch { /* engine not running yet */ }
  return true;
});

app.whenReady().then(() => {
  startEngine();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (engineProc) { try { engineProc.stdin.write("quit\n"); } catch { /* ignore */ } }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
