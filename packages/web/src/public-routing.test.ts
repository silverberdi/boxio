import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

describe("public online routing contract", () => {
  it("uses the API proxy for every public REST operation and websocket", async () => {
    const source = await readFile(new URL("./app.ts", import.meta.url), "utf8");
    for (const path of [
      "/api/public/search",
      "/api/public/search/${this.publicSearchId}",
      "/api/public/search/${this.publicSearchId}/cancel",
      "/api/public/search/${this.publicSearchId}/continue",
      "/api/public/search/${this.publicSearchId}/machine",
      "/api/public/matches/${this.publicMatchId}",
      "/api/public/matches/${this.publicMatchId}/commands",
    ]) expect(source).toContain(path);
    expect(source).toContain("/api/public/matches/${this.publicMatchId}/ws");
    expect(source).not.toContain('fetch("/public/search"');
    expect(source).not.toContain("fetch(`/public/");
    expect(source).not.toContain("window.location.host}/public/matches/");
  });

  it("keeps one proxy boundary and forwards websocket upgrade", async () => {
    const nginx = await readFile(new URL("../../../ops/bootstrap/web/nginx.conf", import.meta.url), "utf8");
    expect(nginx).toContain("location /api/ {");
    expect(nginx).toContain("proxy_pass http://api:8080/;");
    expect(nginx).toContain("proxy_http_version 1.1;");
    expect(nginx).toContain("proxy_set_header Upgrade $http_upgrade;");
    expect(nginx).toContain('proxy_set_header Connection "upgrade";');
    expect(nginx.match(/proxy_pass/g)).toHaveLength(1);
    expect(nginx).not.toContain("location /public/");
  });
});
