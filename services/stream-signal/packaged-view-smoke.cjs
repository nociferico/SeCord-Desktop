const { app, BrowserWindow, ipcMain, net, protocol } = require("electron");
const { join } = require("node:path");
const { pathToFileURL } = require("node:url");

protocol.registerSchemesAsPrivileged([{ scheme: "vesktop", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

app.whenReady().then(async () => {
    const appRoot = process.env.SECORD_PACKAGED_APP || join(__dirname, "..", "..", "release-test", "win-unpacked", "resources", "app.asar");
    protocol.handle("vesktop", request => {
        const url = new URL(request.url);
        const file = join(appRoot, "static", url.pathname);
        return net.fetch(pathToFileURL(file).href);
    });
    ipcMain.handle("secord:stream:sources", () => []);
    const window = new BrowserWindow({ show: false, webPreferences: { preload: join(appRoot, "dist", "js", "streamPreload.js"), contextIsolation: true, nodeIntegration: false } });
    const errors = [];
    window.webContents.on("did-fail-load", (_event, code, description, url) => errors.push({ code, description, url }));
    try {
        await window.loadURL("vesktop://static/views/stream.html");
        const result = await window.webContents.executeJavaScript(`({title:document.title,heading:document.querySelector('h1')?.textContent,stylesheet:!!document.styleSheets.length,script:!!document.querySelector('#status')?.textContent,logo:document.querySelector('.masthead img')?.naturalWidth>0})`);
        console.log(JSON.stringify({ ...result, errors }));
        if (result.heading !== "Transmissão SeCord" || !result.stylesheet || !result.script || !result.logo || errors.length) process.exitCode = 1;
    } catch (error) { console.error(error); process.exitCode = 1; }
    window.close();
    app.quit();
}).catch(error => { console.error(error); app.exit(1); });
