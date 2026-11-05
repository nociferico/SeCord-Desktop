const { app, BrowserWindow, ipcMain } = require("electron");
const { join } = require("node:path");
const { WebSocket } = require("ws");

async function main() {
    const { createSignalServer } = await import("./server.mjs");
    const signal = createSignalServer({ port: 0 });
    const address = await signal.listen();
    const url = `ws://127.0.0.1:${address.port}/signal`;
    const room = "0123456789abcdef0123456789abcdef";
    const root = join(__dirname, "..", "..");
    const host = new WebSocket(url);
    const hostReady = new Promise((resolve, reject) => {
        host.once("open", () => host.send(JSON.stringify({ t: "create", room })));
        host.once("message", raw => {
            const message = JSON.parse(raw.toString());
            if (message.t === "created") resolve();
            else reject(new Error("Host room was not created"));
        });
        host.once("error", reject);
    });
    await hostReady;

    ipcMain.handle("secord:stream:sources", () => [{ id: "screen:0:0", name: "Tela de teste", thumbnail: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==" }]);
    ipcMain.handle("secord:stream:select", () => {});
    ipcMain.handle("secord:stream:copy", () => {});

    const window = new BrowserWindow({
        show: false,
        webPreferences: { preload: join(root, "dist", "js", "streamPreload.js"), contextIsolation: true, nodeIntegration: false }
    });
    const errors = [];
    window.webContents.on("console-message", details => { if (details.level === "error") errors.push(details.message); });
    await window.loadFile(join(root, "static", "views", "stream.html"));
    const result = await window.webContents.executeJavaScript(`(async () => {
        const until = async test => {
            for (let n = 0; n < 100; n++) {
                if (test()) return;
                await new Promise(resolve => setTimeout(resolve, 20));
            }
            throw new Error("Interface did not reach expected state");
        };
        await until(() => document.querySelectorAll("#sources button").length === 1);
        document.querySelector("#sources button").click();
        await until(() => !document.querySelector("#start").disabled);
        document.querySelector("#join-code").value = "SECORD1|${url}|${room}";
        document.querySelector("#join").click();
        await until(() => document.querySelector("#status").textContent.includes("Esperando o vídeo"));
        return { title: document.title, source: document.querySelector("#sources button span").textContent, status: document.querySelector("#status").textContent };
    })()`);
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(JSON.stringify(result));
    window.close();
    host.close();
    await signal.close();
    app.quit();
}

app.whenReady().then(main).catch(error => { console.error(error); app.exit(1); });
