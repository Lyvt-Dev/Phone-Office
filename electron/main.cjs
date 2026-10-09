const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");
function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 380,
    minHeight: 600,
    title: "Phone Office",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    if (
      url !==
      require("node:url").pathToFileURL(
        path.join(__dirname, "../dist/index.html"),
      ).href
    ) {
      event.preventDefault();
      if (/^https:\/\//i.test(url)) shell.openExternal(url);
    }
  });
  window.loadFile(path.join(__dirname, "../dist/index.html"));
}
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (!BrowserWindow.getAllWindows().length) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
