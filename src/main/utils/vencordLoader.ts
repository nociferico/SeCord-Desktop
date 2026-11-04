/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { access, constants as FsConstants } from "fs/promises";
import { join } from "path";

import { VENCORD_FILES_DIR } from "main/vencordFilesDir";

// This app ships its own SeCord build and never replaces it with an upstream download.

export const FILES_TO_DOWNLOAD = [
    "vencordDesktopMain.js",
    "vencordDesktopPreload.js",
    "vencordDesktopRenderer.js",
    "vencordDesktopRenderer.css"
];

const existsAsync = (path: string) =>
    access(path, FsConstants.F_OK)
        .then(() => true)
        .catch(() => false);

export async function isValidVencordInstall(dir: string) {
    const results = await Promise.all(FILES_TO_DOWNLOAD.map(f => existsAsync(join(dir, f))));
    return !results.includes(false);
}

export async function ensureVencordFiles() {
    if (!(await isValidVencordInstall(VENCORD_FILES_DIR))) {
        throw new Error("SeCord files are missing. Rebuild the desktop app with pnpm build:nocicord.");
    }
}
