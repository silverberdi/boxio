import { describe, expect, it } from "vitest";
import { UpdateCoordinator } from "./update-coordinator";

describe("UpdateCoordinator", () => {
  it("does not activate an update while a local game is active", () => {
    const coordinator = new UpdateCoordinator();
    coordinator.notifyNewVersion();
    expect(coordinator.canActivate("active-game")).toBe(false);
    expect(coordinator.updatePending).toBe(true);
  });

  it("consumes a pending update only at a safe boundary", () => {
    const coordinator = new UpdateCoordinator();
    coordinator.notifyNewVersion();
    expect(coordinator.consumeAtSafeBoundary("safe")).toBe(true);
    expect(coordinator.updatePending).toBe(false);
  });
});
