import { describe, it, expect, afterAll } from "vitest";

import { SEED_DEFAULT_PASSWORD, SUPER_ADMIN_EMAIL } from "./config";
import { db, findUserByRole, get, mintAccessToken, post } from "./helpers";

/**
 * NOTE on rate limits: auth/login is throttled at 5 requests/minute. This file
 * performs exactly 3 HTTP logins; every other suite mints tokens directly.
 */
describe("auth (integration)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  describe("forced password change is enforced server-side", () => {
    const NEW_PASSWORD = "IntegrationTest123!";
    let teacherEmail: string;
    let initialAccessToken: string;

    it("seeded portal user logs in with forceChangePassword=true", async () => {
      const teacher = await findUserByRole("guru");
      teacherEmail = teacher.email;

      const res = await post("auth/login", { email: teacherEmail, password: SEED_DEFAULT_PASSWORD });
      expect(res.status).toBe(201);
      expect(res.body.data.user.forceChangePassword).toBe(true);
      initialAccessToken = res.body.data.accessToken;
    });

    it("blocks guarded endpoints with 403 until the password is rotated", async () => {
      const blocked = await get("teacher-portal/dashboard", initialAccessToken);
      expect(blocked.status).toBe(403);

      // me and change-password stay reachable so the user can escape the gate
      const me = await get("auth/me", initialAccessToken);
      expect(me.status).toBe(200);
    });

    it("change-password lifts the gate and restores access", async () => {
      const changed = await post(
        "auth/change-password",
        { currentPassword: SEED_DEFAULT_PASSWORD, newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD },
        initialAccessToken,
      );
      expect(changed.status).toBe(201);

      // Old access token is invalidated by passwordChangedAt rotation
      const stale = await get("auth/me", initialAccessToken);
      expect(stale.status).toBe(401);

      const relogin = await post("auth/login", { email: teacherEmail, password: NEW_PASSWORD });
      expect(relogin.status).toBe(201);
      expect(relogin.body.data.user.forceChangePassword).toBe(false);

      const dashboard = await get("teacher-portal/dashboard", relogin.body.data.accessToken);
      expect(dashboard.status).toBe(200);
    });
  });

  describe("refresh token rotation", () => {
    it("is single-use, and reuse revokes the whole session family", async () => {
      const login = await post("auth/login", { email: SUPER_ADMIN_EMAIL, password: SEED_DEFAULT_PASSWORD });
      expect(login.status).toBe(201);
      const originalRefreshToken = login.body.data.refreshToken as string;

      const first = await post("auth/refresh", { refreshToken: originalRefreshToken });
      expect(first.status).toBe(201);
      const rotatedRefreshToken = first.body.data.refreshToken as string;

      // Replaying the already-rotated token must fail...
      const replay = await post("auth/refresh", { refreshToken: originalRefreshToken });
      expect(replay.status).toBe(401);

      // ...and must revoke the rotated token too (session family revocation)
      const revokedFamily = await post("auth/refresh", { refreshToken: rotatedRefreshToken });
      expect(revokedFamily.status).toBe(401);
    });
  });

  describe("RBAC", () => {
    it("rejects unauthenticated requests to guarded endpoints", async () => {
      const res = await get("payments");
      expect(res.status).toBe(401);
    });

    it("rejects a student token on admin finance endpoints with 403", async () => {
      const student = await findUserByRole("siswa");
      // Lift the forced-password gate so we exercise the permission check itself
      await db.user.update({ where: { id: student.id }, data: { forceChangePassword: false } });

      const token = await mintAccessToken(student.email);
      const res = await get("payments", token);
      expect(res.status).toBe(403);
    });
  });
});
