const { app, BrowserWindow, desktopCapturer, ipcMain, session } = require("electron");
const { join } = require("node:path");

async function main() {
    const { createSignalServer } = await import("./server.mjs");
    const signal = createSignalServer({ port: 0 });
    const address = await signal.listen();
    const root = join(__dirname, "..", "..");
    let selectedSource = null;
    let userGesture = null;
    ipcMain.handle("secord:stream:sources", async () => {
        const sources = await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: { width: 80, height: 45 } });
        return sources.map(source => ({ id: source.id, name: source.name, thumbnail: source.thumbnail.toDataURL() }));
    });
    ipcMain.handle("secord:stream:select", (_event, id) => { selectedSource = id; });
    ipcMain.handle("secord:stream:copy", () => {});
    session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
        userGesture = request.userGesture;
        const sources = await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: { width: 0, height: 0 } });
        callback({ video: sources.find(source => source.id === selectedSource) });
    });
    const window = new BrowserWindow({
        width: 880,
        height: 760,
        show: true,
        webPreferences: { preload: join(root, "dist", "js", "streamPreload.js"), contextIsolation: true, nodeIntegration: false }
    });
    await window.loadFile(join(root, "static", "views", "stream.html"));
    const button = await window.webContents.executeJavaScript(`(async () => {
        for (let n=0;n<100;n++) {
            if (document.querySelector("#sources button")) break;
            await new Promise(resolve => setTimeout(resolve,20));
        }
        document.querySelector("#sources button").click();
        for (let n=0;n<100;n++) {
            if (!document.querySelector("#start").disabled) break;
            await new Promise(resolve => setTimeout(resolve,20));
        }
        document.querySelector("#server").value = "ws://127.0.0.1:${address.port}/signal";
        const rect = document.querySelector("#start").getBoundingClientRect();
        return {x:Math.floor(rect.x+rect.width/2),y:Math.floor(rect.y+rect.height/2)};
    })()`);
    window.webContents.sendInputEvent({ type: "mouseDown", x: button.x, y: button.y, button: "left", clickCount: 1 });
    window.webContents.sendInputEvent({ type: "mouseUp", x: button.x, y: button.y, button: "left", clickCount: 1 });
    const result = await window.webContents.executeJavaScript(`(async () => {
        for (let n=0;n<200;n++) {
            const track = document.querySelector("#video").srcObject?.getVideoTracks()[0];
            if (track?.readyState === "live") {
                document.querySelector("#stop").click();
                return {captured:true,label:track.label};
            }
            await new Promise(resolve => setTimeout(resolve,20));
        }
        return {captured:false,status:document.querySelector("#status").textContent};
    })()`);
    console.log(JSON.stringify({ ...result, userGesture }));
    window.close();
    await signal.close();
    app.quit();
    if (!result.captured || !userGesture) process.exitCode = 1;
}

app.whenReady().then(main).catch(error => { console.error(error); app.exit(1); });
