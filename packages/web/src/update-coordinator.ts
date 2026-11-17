export type UpdateBoundary = "active-game" | "safe";

/** Keeps an installed update pending while a local game is visible. No game state is persisted. */
export class UpdateCoordinator {
  private pending = false;

  get updatePending() { return this.pending; }

  notifyNewVersion() { this.pending = true; }

  canActivate(boundary: UpdateBoundary) { return boundary === "safe" && this.pending; }

  consumeAtSafeBoundary(boundary: UpdateBoundary) {
    if (!this.canActivate(boundary)) return false;
    this.pending = false;
    return true;
  }
}
