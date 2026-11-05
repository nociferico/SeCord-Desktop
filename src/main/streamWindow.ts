/* SeCord private stream window. SPDX-License-Identifier: GPL-3.0-or-later */
import { join } from "path";

import { BrowserWindow, clipboard, desktopCapturer, ipcMain } from "electron";
import { loadView } from "./vesktopStatic";

let streamWindow: BrowserWindow | null = null;
let selectedSourceId: string | null = null;

export function isSeCordStreamFrame(frame: Electron.WebFrameMain | null) {
    return !!streamWindow && !streamWindow.isDestroyed() && frame === streamWindow.webContents.mainFrame;
}

export function selectedStreamSource() {
    return selectedSourceId;
}

export function openStreamWindow() {
    if (streamWindow && !streamWindow.isDestroyed()) {
        streamWindow.show();
        streamWindow.focus();
        return;
    }

    streamWindow = new BrowserWindow({
        title: "SeCord — transmissão própria",
        width: 880,
        height: 760,
        minWidth: 620,
        minHeight: 570,
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: join(__dirname, "streamPreload.js")
        }
    });
    void loadView(streamWindow, "stream.html").catch(error => {
        console.error("Failed to load SeCord stream view", error);
        if (streamWindow && !streamWindow.isDestroyed()) {
            void streamWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent("<html lang='pt-BR'><body style='background:#17151d;color:#f1edf4;font:16px sans-serif;padding:30px'><h1>Não foi possível abrir a transmissão.</h1><p>Reinicie o SeCord ou instale a versão mais recente.</p></body></html>"));
        }
    });
    streamWindow.on("closed", () => { streamWindow = null; selectedSourceId = null; });
}

function isStreamSender(event: Electron.IpcMainInvokeEvent) {
    return !!streamWindow && !streamWindow.isDestroyed() && event.sender === streamWindow.webContents && isSeCordStreamFrame(event.senderFrame);
}

ipcMain.handle("secord:stream:sources", async event => {
    if (!isStreamSender(event)) throw new Error("Janela inválida.");
    const sources = await desktopCapturer.getSources({ types: ["window", "screen"], thumbnailSize: { width: 144, height: 90 } });
    return sources.map(source => ({ id: source.id, name: source.name, thumbnail: source.thumbnail.toDataURL() }));
});

ipcMain.handle("secord:stream:select", async (event, sourceId: string) => {
    if (!isStreamSender(event) || typeof sourceId !== "string") throw new Error("Fonte inválida.");
    const sources = await desktopCapturer.getSources({ types: ["window", "screen"], thumbnailSize: { width: 0, height: 0 } });
    if (!sources.some(source => source.id === sourceId)) throw new Error("A tela selecionada não está disponível.");
    selectedSourceId = sourceId;
});

ipcMain.handle("secord:stream:copy", (event, value: string) => {
    if (!isStreamSender(event) || typeof value !== "string" || value.length > 1000) throw new Error("Convite inválido.");
    clipboard.writeText(value);
});
