/* SeCord private stream bridge. SPDX-License-Identifier: GPL-3.0-or-later */
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("SeCordStream", {
    listSources: () => ipcRenderer.invoke("secord:stream:sources"),
    selectSource: (id: string) => ipcRenderer.invoke("secord:stream:select", id),
    copy: (value: string) => ipcRenderer.invoke("secord:stream:copy", value)
});
