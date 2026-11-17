import { mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";

const execFileAsync = promisify(execFile);
const sourcePath = resolve("assets/branding/boxio-app-icon.svg");
const source = await readFile(sourcePath, "utf8");
if (!source.includes("<svg") || !source.includes("#FFC72C")) {
  throw new Error(`Unexpected canonical icon: ${sourcePath}`);
}
const sourceSha = createHash("sha256").update(source).digest("hex");
const base64 = Buffer.from(source).toString("base64");
const dataUrl = `data:image/svg+xml;base64,${base64}`;

await mkdir("packages/web/public/icons", { recursive: true });

for (const size of [192, 512]) {
  const outPath = resolve(`packages/web/public/icons/boxio-icon-${size}.png`);
  await execFileAsync("google-chrome", [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    `--window-size=${size},${size}`,
    `--screenshot=${outPath}`,
    dataUrl,
  ]);
}

console.log(`Generated authentic PWA icons from canonical SVG ${sourcePath} (SHA256: ${sourceSha})`);
