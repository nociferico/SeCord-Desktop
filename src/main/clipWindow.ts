/*
 * SeCord local audio clips
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { writeFile } from "fs/promises";
import { join } from "path";

import { BrowserWindow, dialog, ipcMain } from "electron";
import { loadView } from "./vesktopStatic";

let clipWindow: BrowserWindow | null = null;

export function isClipFrame(frame: Electron.WebFrameMain | null) {
    return !!clipWindow && !clipWindow.isDestroyed() && frame === clipWindow.webContents.mainFrame;
}

export function openClipWindow() {
    if (clipWindow && !clipWindow.isDestroyed()) {
        clipWindow.show();
        clipWindow.focus();
        return;
    }

    clipWindow = new BrowserWindow({
        title: "SeCord — clipes de áudio",
        width: 460,
        height: 530,
        minWidth: 420,
        minHeight: 490,
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: join(__dirname, "clipPreload.js")
        }
    });
    void loadView(clipWindow, "clips.html");
    clipWindow.on("closed", () => (clipWindow = null));
}

ipcMain.handle("secord:clip:save", async (event, data: Uint8Array, seconds: number) => {
    if (!clipWindow || clipWindow.isDestroyed() || event.sender !== clipWindow.webContents) {
        throw new Error("Janela de clipes inválida.");
    }
    if (![30, 60, 120].includes(seconds) || !(data instanceof Uint8Array) || data.length < 44 || data.length > 30_000_000) {
        throw new Error("Áudio inválido.");
    }

    const { canceled, filePath } = await dialog.showSaveDialog(clipWindow, {
        title: "Salvar clipe de áudio",
        defaultPath: `SeCord-${new Date().toISOString().replaceAll(/[:.]/g, "-")}-${seconds}s.wav`,
        filters: [{ name: "Áudio WAV", extensions: ["wav"] }]
    });
    if (canceled || !filePath) return false;
    await writeFile(filePath, data);
    return true;
});
