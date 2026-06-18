import { describe, it, expect, afterAll, beforeAll } from "vitest";

import { adminToken, db, get, post } from "./helpers";

describe("PPDB portal provisioning (integration)", () => {
  let periodId: string;

  beforeAll(async () => {
    const period = await db.ppdbPeriod.findFirst({ where: { isActive: true } });
    if (!period) throw new Error("Active PPDB period missing from seed");
    periodId = period.id;
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  async function createAcceptedRegistration(suffix: string) {
    return db.ppdbRegistration.create({
      data: {
        registrationNumber: `REG-PROV-${suffix}`,
        periodId,
        name: `Portal Provision ${suffix}`,
        gender: "FEMALE",
        phone: `0812${suffix.slice(-8).padStart(8, "0")}`,
        email: `portal.provision.${suffix}@nexsmsid.dev`,
        status: "ACCEPTED",
        selectionStatus: "PASSED",
      },
    });
  }

  it("converts ACCEPTED registration to student with portal credentials", async () => {
    const suffix = String(Date.now());
    const registration = await createAcceptedRegistration(suffix);
    const token = await adminToken();

    const convert = await post(
      `ppdb/registrations/${registration.id}/convert-to-student`,
      {
        provisionPortalAccount: true,
        sendWelcomeEmail: false,
      },
      token,
    );

    expect(convert.status).toBe(201);
    expect(convert.body.data.portalAccount.email).toBe(registration.email);
    expect(convert.body.data.portalAccount.temporaryPassword).toBeTruthy();
    expect(convert.body.data.registration.status).toBe("CONVERTED");

    const login = await post("auth/login", {
      email: registration.email,
      password: convert.body.data.portalAccount.temporaryPassword,
    });
    expect(login.status).toBe(201);
    expect(login.body.data.user.forceChangePassword).toBe(true);

    const accessToken = login.body.data.accessToken as string;
    const changed = await post(
      "auth/change-password",
      {
        currentPassword: convert.body.data.portalAccount.temporaryPassword,
        newPassword: "PortalStudent123!",
        confirmPassword: "PortalStudent123!",
      },
      accessToken,
    );
    expect(changed.status).toBe(201);

    const relogin = await post("auth/login", { email: registration.email, password: "PortalStudent123!" });
    expect(relogin.status).toBe(201);
    expect(relogin.body.data.user.forceChangePassword).toBe(false);

    const dashboard = await get("student-portal/dashboard", relogin.body.data.accessToken);
    expect(dashboard.status).toBe(200);
  });

  it("rejects convert without email when email is required", async () => {
    const suffix = String(Date.now() + 1);
    const registration = await db.ppdbRegistration.create({
      data: {
        registrationNumber: `REG-NOEMAIL-${suffix}`,
        periodId,
        name: "Tanpa Email",
        gender: "MALE",
        phone: `0813${suffix.slice(-8).padStart(8, "0")}`,
        status: "ACCEPTED",
        selectionStatus: "PASSED",
      },
    });

    const token = await adminToken();
    const convert = await post(`ppdb/registrations/${registration.id}/convert-to-student`, { provisionPortalAccount: true }, token);

    expect(convert.status).toBe(400);
    expect(convert.body.message).toContain("Email wajib");
  });
});
