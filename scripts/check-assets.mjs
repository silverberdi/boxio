import { access, readFile } from "node:fs/promises";
const assets = ["assets/branding/boxio-wordmark.svg", "assets/branding/boxio-app-icon.svg", "assets/audio/boxio-sounds.ts", "assets/boards/silhouette-candidates.json", "assets/design-tokens.json", "packages/web/public/manifest.webmanifest", "packages/web/public/icons/boxio-icon-192.png", "packages/web/public/icons/boxio-icon-512.png"];
for (const file of assets) { await access(file); const content = await readFile(file, "utf8"); if (!content.trim()) throw new Error(`Canonical asset is empty: ${file}`); }
if ((await import("node:fs/promises")).glob) { /* no fallback download path */ }
const silhouettes = JSON.parse(await readFile("assets/boards/silhouette-candidates.json", "utf8"));
if (silhouettes.templates?.length !== 9 || silhouettes.templates.some(({ rows }) => !rows?.length || rows.some((row) => row.length !== rows[0].length || !/^[#.]+$/.test(row)))) throw new Error("Silhouette catalog must contain nine rectangular local masks");
const forbidden = ["https://", "http://", ".mp3", ".wav", "chat"];
const sourceFiles = ["packages/web/src", "assets"];
for (const root of sourceFiles) {
  const { glob } = await import("node:fs/promises");
  if (!glob) continue;
  for await (const file of glob(`${root}/**/*`)) {
    if (!file.endsWith(".ts") && !file.endsWith(".html") && !file.endsWith(".json")) continue;
    const content = await readFile(file, "utf8");
    if (forbidden.some((value) => content.includes(value))) throw new Error(`Forbidden external or chat asset reference: ${file}`);
  }
}
console.log(`Validated ${assets.length} local canonical assets and nine silhouette masks`);
