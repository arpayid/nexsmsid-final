import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { adminToken, db, post } from "./helpers";

describe("library (integration)", () => {
  let token: string;
  let memberId: string;

  beforeAll(async () => {
    token = await adminToken();
    const member = await db.libraryMember.findFirstOrThrow({ where: { status: "ACTIVE", deletedAt: null } });
    memberId = member.id;
    // Headroom for the loans created in this suite
    await db.libraryMember.update({ where: { id: memberId }, data: { maxLoan: 10 } });

    // Dedicated book with three copies so the suite does not depend on scarce seed copies
    const category = await db.libraryCategory.findFirstOrThrow({ where: { deletedAt: null } });
    const admin = await db.user.findFirstOrThrow({ where: { email: "superadmin@nexsmsid.dev" } });
    const book = await db.libraryBook.create({
      data: {
        categoryId: category.id,
        code: "ITEST-BOOK-1",
        title: "Integration Test Book",
        author: "Integration Tester",
        createdById: admin.id,
      },
    });
    await db.libraryBookCopy.createMany({
      data: [1, 2, 3].map((i) => ({ bookId: book.id, copyCode: `ITEST-CP-${i}`, status: "AVAILABLE" })),
    });
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  async function availableCopy() {
    return db.libraryBookCopy.findFirstOrThrow({
      where: { status: "AVAILABLE", deletedAt: null, copyCode: { startsWith: "ITEST-CP-" } },
    });
  }

  function borrow(copyId: string, dueAt = new Date(Date.now() + 7 * 86_400_000)) {
    return post("library/loans", { memberId, copyId, dueAt: dueAt.toISOString() }, token);
  }

  it("only one of two PARALLEL borrows of the same copy succeeds", async () => {
    const copy = await availableCopy();

    const results = await Promise.all([borrow(copy.id), borrow(copy.id)]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 400]);

    const failed = results.find((r) => r.status === 400);
    expect(failed?.body.message).toContain("not available");

    const activeLoans = await db.libraryLoan.count({
      where: { copyId: copy.id, status: { in: ["BORROWED", "OVERDUE"] }, deletedAt: null },
    });
    expect(activeLoans).toBe(1);

    const after = await db.libraryBookCopy.findUniqueOrThrow({ where: { id: copy.id } });
    expect(after.status).toBe("BORROWED");
  });

  it("returning an overdue loan creates a late fine and frees the copy", async () => {
    const copy = await availableCopy();
    const borrowed = await borrow(copy.id);
    expect(borrowed.status).toBe(201);
    const loanId = borrowed.body.data.id as string;

    // Make the loan ~3 days overdue (1h short of exactly 3 days, since the fine rounds days UP)
    await db.libraryLoan.update({
      where: { id: loanId },
      data: { dueAt: new Date(Date.now() - 3 * 86_400_000 + 3_600_000) },
    });

    const returned = await post(`library/loans/${loanId}/return`, {}, token);
    expect(returned.status).toBe(201);

    const fine = await db.libraryFine.findFirst({ where: { loanId } });
    expect(fine).not.toBeNull();
    expect(Number(fine!.amount)).toBe(3 * 1000); // Rp 1000 per day

    const after = await db.libraryBookCopy.findUniqueOrThrow({ where: { id: copy.id } });
    expect(after.status).toBe("AVAILABLE");
  });

  it("enforces the member's maxLoan limit", async () => {
    const active = await db.libraryLoan.count({
      where: { memberId, status: { in: ["BORROWED", "OVERDUE"] }, deletedAt: null },
    });
    await db.libraryMember.update({ where: { id: memberId }, data: { maxLoan: active } });

    const copy = await availableCopy();
    const res = await borrow(copy.id);
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("maximum loan limit");

    await db.libraryMember.update({ where: { id: memberId }, data: { maxLoan: 10 } });
  });
});
