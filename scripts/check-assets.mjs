import { access, readFile } from "node:fs/promises";
const assets = ["assets/branding/boxio-wordmark.svg", "assets/branding/boxio-app-icon.svg", "assets/audio/boxio-sounds.ts", "packages/web/public/manifest.webmanifest", "packages/web/public/icons/boxio-icon-192.png", "packages/web/public/icons/boxio-icon-512.png"];
for (const file of assets) { await access(file); const content = await readFile(file, "utf8"); if (!content.trim()) throw new Error(`Canonical asset is empty: ${file}`); }
if ((await import("node:fs/promises")).glob) { /* no fallback download path */ }
console.log(`Validated ${assets.length} local canonical assets`);
