/*
 * SeCord local audio clips
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("SeCordClips", {
    save(data: Uint8Array, seconds: number) {
        return ipcRenderer.invoke("secord:clip:save", data, seconds) as Promise<boolean>;
    }
});
