import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { db, fetchStaticUpload, get, post, postMultipart, TEST_CAPTCHA_TOKEN } from "./helpers";

function makePdfBuffer(): Buffer {
  return Buffer.from("%PDF-1.4\n% NexSMSID integration test\n", "ascii");
}

describe("public PPDB (integration)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("exposes the active period without authentication", async () => {
    const res = await get("public/ppdb/active-period");
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBeTruthy();
  });

  describe("registration under parallel load", () => {
    let periodId: string;

    beforeAll(async () => {
      const now = Date.now();
      const period = await db.ppdbPeriod.create({
        data: {
          name: "Integration Test Period",
          startDate: new Date(now - 86_400_000),
          endDate: new Date(now + 86_400_000),
          isActive: true,
          quota: 3,
        },
      });
      periodId = period.id;
    });

    /**
     * NOTE: public/ppdb/register is throttled at 5 requests/minute — this test
     * fires exactly 5 requests and is the only register caller in the suite.
     */
    it("enforces the quota exactly and allocates unique numbers under parallel burst", async () => {
      const register = (i: number) =>
        post("public/ppdb/register", {
          periodId,
          name: `Integration Applicant ${i}`,
          gender: i % 2 === 0 ? "MALE" : "FEMALE",
          phone: `0812000000${i}`,
          pin: "123456",
          captchaToken: TEST_CAPTCHA_TOKEN,
        });

      const results = await Promise.all([1, 2, 3, 4, 5].map(register));

      const succeeded = results.filter((r) => r.status === 201);
      const rejected = results.filter((r) => r.status === 400);
      expect(succeeded.length).toBe(3); // quota
      expect(rejected.length).toBe(2);
      for (const r of rejected) {
        expect(r.body.message).toContain("quota");
      }

      const numbers = succeeded.map((r) => r.body.data.registrationNumber as string);
      expect(new Set(numbers).size).toBe(3);
      for (const number of numbers) {
        expect(number).toMatch(/^REG-\d{6}-[0-9A-F]{8}$/);
      }

      const persisted = await db.ppdbRegistration.count({ where: { periodId } });
      expect(persisted).toBe(3);

      // Status history is written atomically with each registration
      const histories = await db.ppdbStatusHistory.count({
        where: { registration: { periodId }, toStatus: "SUBMITTED" },
      });
      expect(histories).toBe(3);
    });
  });

  describe("document upload security", () => {
    const registrationNumber = "REG-202606-00001";
    const phone = "081111222333";

    it("issues an upload token on status check and accepts a bound document upload", async () => {
      const status = await post("public/ppdb/check-status", {
        registrationNumber,
        phone,
        pin: "123456",
        captchaToken: TEST_CAPTCHA_TOKEN,
      });
      expect(status.status).toBe(201);
      expect(status.body.data.uploadToken).toBeTruthy();

      const uploadToken = status.body.data.uploadToken as string;
      const formData = new FormData();
      formData.append("uploadToken", uploadToken);
      formData.append("captchaToken", TEST_CAPTCHA_TOKEN);
      formData.append("file", new Blob([makePdfBuffer()], { type: "application/pdf" }), "kk.pdf");

      const upload = await postMultipart("public/ppdb/upload", formData);
      expect(upload.status).toBe(201);
      expect(upload.body.data.fileKey).toMatch(/^ppdb\//);

      const submit = await post("public/ppdb/documents", {
        registrationNumber,
        phone,
        name: "Kartu Keluarga",
        fileKey: upload.body.data.fileKey,
        uploadToken,
        captchaToken: TEST_CAPTCHA_TOKEN,
      });
      expect(submit.status).toBe(201);
      expect(submit.body.data.id).toBeTruthy();

      const blocked = await fetchStaticUpload(`/uploads/${upload.body.data.fileKey}`);
      expect(blocked).toBe(404);
    });

    it("rejects upload without a token", async () => {
      const formData = new FormData();
      formData.append("captchaToken", TEST_CAPTCHA_TOKEN);
      formData.append("file", new Blob([makePdfBuffer()], { type: "application/pdf" }), "kk.pdf");
      const upload = await postMultipart("public/ppdb/upload", formData);
      expect(upload.status).toBe(401);
    });

    it("rejects disguised binaries for PPDB upload", async () => {
      const status = await post("public/ppdb/check-status", {
        registrationNumber,
        phone,
        pin: "123456",
        captchaToken: TEST_CAPTCHA_TOKEN,
      });
      const uploadToken = status.body.data.uploadToken as string;
      const formData = new FormData();
      formData.append("uploadToken", uploadToken);
      formData.append("captchaToken", TEST_CAPTCHA_TOKEN);
      formData.append("file", new Blob([Buffer.from([0x4d, 0x5a, 0x90, 0x00])], { type: "application/pdf" }), "fake.pdf");
      const upload = await postMultipart("public/ppdb/upload", formData);
      expect(upload.status).toBe(400);
    });
  });
});
