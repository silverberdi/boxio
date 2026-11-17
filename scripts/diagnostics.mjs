import { execFileSync } from "node:child_process";
const version = (command, args = ["--version"]) => { try { return execFileSync(command, args, { encoding: "utf8" }).trim(); } catch { return "not installed"; } };
console.log(JSON.stringify({ node: version("node"), npm: version("npm"), typescript: "5.9.3", angular: "21.2.26", fastify: "5.12.8", vitest: "4.1.12", openspec: version("openspec") }, null, 2));
