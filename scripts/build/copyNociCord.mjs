import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve("../NociCord/dist");
const target = resolve("static/nocicord");
const files = [
    "vencordDesktopMain.js",
    "vencordDesktopPreload.js",
    "vencordDesktopRenderer.js",
    "vencordDesktopRenderer.css"
];

for (const file of files) {
    if (!existsSync(resolve(source, file))) {
        throw new Error(`Missing ${file}. Build ../NociCord with pnpm build:nocicord first.`);
    }
}

mkdirSync(target, { recursive: true });
for (const file of files) copyFileSync(resolve(source, file), resolve(target, file));
writeFileSync(resolve(target, "package.json"), "{}\n");
console.log("Bundled local NociCord client files.");
