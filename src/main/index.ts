/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { app } from "electron";

import { CommandLine } from "./cli";
import { ensureVencordFiles } from "./utils/vencordLoader";

if (CommandLine.values.repair) {
    console.log("Checking SeCord files...");
    ensureVencordFiles()
        .then(() => app.quit())
        .catch(error => {
            console.error(error);
            app.exit(1);
        });
} else {
    require("./main");
}
