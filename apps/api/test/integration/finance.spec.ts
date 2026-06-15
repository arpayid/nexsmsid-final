import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { adminToken, db, get, post } from "./helpers";

describe("finance (integration)", () => {
  let token: string;
  let studentId: string;

  beforeAll(async () => {
    token = await adminToken();
    const student = await db.student.findFirstOrThrow({ where: { deletedAt: null } });
    studentId = student.id;
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  async function createInvoice(unitPrice: number) {
    const res = await post(
      "invoices",
      {
        studentId,
        discount: 0,
        penalty: 0,
        items: [{ name: "Integration Test Fee", quantity: 1, unitPrice }],
      },
      token,
    );
    expect(res.status).toBe(201);
    return res.body.data as { id: string; invoiceNumber: string; total: unknown };
  }

  async function createPayment(invoiceId: string, amount: number) {
    const res = await post("payments", { invoiceId, amount, method: "CASH" }, token);
    expect(res.status).toBe(201);
    return res.body.data as { id: string; paymentNumber: string };
  }

  it("creates an invoice with a generated unique number", async () => {
    const invoice = await createInvoice(50_000);
    expect(invoice.invoiceNumber).toMatch(/^INV-\d{6}-\d{5}$/);
    expect(Number(invoice.total)).toBe(50_000);
  });

  it("keeps invoice balance exact under PARALLEL payment verification", async () => {
    const invoice = await createInvoice(100_000);
    const pay1 = await createPayment(invoice.id, 60_000);
    const pay2 = await createPayment(invoice.id, 40_000);

    const [v1, v2] = await Promise.all([post(`payments/${pay1.id}/verify`, {}, token), post(`payments/${pay2.id}/verify`, {}, token)]);
    expect(v1.status).toBe(201);
    expect(v2.status).toBe(201);

    const after = await get(`invoices/${invoice.id}`, token);
    expect(Number(after.body.data.paidAmount)).toBe(100_000);
    expect(after.body.data.status).toBe("PAID");

    // No more payments on a PAID invoice
    const extra = await post("payments", { invoiceId: invoice.id, amount: 10_000, method: "CASH" }, token);
    expect(extra.status).toBe(400);

    // Verifying an already-verified payment is rejected
    const doubleVerify = await post(`payments/${pay1.id}/verify`, {}, token);
    expect(doubleVerify.status).toBe(400);

    // Cancelling a verified payment recomputes the balance from remaining verified payments
    const cancel = await post(`payments/${pay2.id}/cancel`, {}, token);
    expect(cancel.status).toBe(201);
    const afterCancel = await get(`invoices/${invoice.id}`, token);
    expect(Number(afterCancel.body.data.paidAmount)).toBe(60_000);
    expect(afterCancel.body.data.status).toBe("PARTIAL");
  });

  it("rejects verification that would exceed the invoice total", async () => {
    const invoice = await createInvoice(100_000);
    const pay1 = await createPayment(invoice.id, 60_000);
    const pay2 = await createPayment(invoice.id, 70_000);

    const v1 = await post(`payments/${pay1.id}/verify`, {}, token);
    expect(v1.status).toBe(201);

    const v2 = await post(`payments/${pay2.id}/verify`, {}, token);
    expect(v2.status).toBe(400);

    const after = await get(`invoices/${invoice.id}`, token);
    expect(Number(after.body.data.paidAmount)).toBe(60_000);
    expect(after.body.data.status).toBe("PARTIAL");
  });

  it("only one of two PARALLEL verifications of the SAME payment wins", async () => {
    const invoice = await createInvoice(100_000);
    const payment = await createPayment(invoice.id, 100_000);

    const results = await Promise.all([post(`payments/${payment.id}/verify`, {}, token), post(`payments/${payment.id}/verify`, {}, token)]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 400]);

    const after = await get(`invoices/${invoice.id}`, token);
    expect(Number(after.body.data.paidAmount)).toBe(100_000);
  });
});
