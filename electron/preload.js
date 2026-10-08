const { contextBridge, ipcRenderer } = require("electron");

console.log("[STAGE C0: preload.js] Preload script loaded successfully with CommonJS require(). Exposing window.chessEngine.");

contextBridge.exposeInMainWorld("chessEngine", {
  isAvailable: true,
  search: (fen, config) => {
    console.log("[STAGE C1: preload.js] window.chessEngine.search called with FEN:", fen, "config:", config);
    return ipcRenderer.invoke("engine:search", fen, config);
  },
  newGame: () => ipcRenderer.invoke("engine:newgame"),
});
