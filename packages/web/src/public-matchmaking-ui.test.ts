import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

describe("public matchmaking accessibility contract", () => {
  it("keeps authoritative public states and accessible actions in the template", async () => {
    const source = await readFile(new URL("./app.ts", import.meta.url), "utf8");
    expect(source).toContain("Partida pública");
    expect(source).toContain("Cancelar búsqueda");
    expect(source).toContain("Jugar contra la máquina (partida separada)");
    expect(source).toContain("Victoria por abandono");
    expect(source).toContain("role=\"status\"");
    expect(source).toContain("prefers-reduced-motion:reduce");
    expect(source).toContain("min-height:44px");
  });
});
