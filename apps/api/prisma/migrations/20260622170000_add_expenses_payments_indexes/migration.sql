-- Align migrations with schema.prisma: add the performance indexes declared on
-- the `expenses` and `payments` models that were missing from the migration
-- history (fixes `prisma migrate diff ... --exit-code` drift in CI).

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- CreateIndex
CREATE INDEX "expenses_created_at_idx" ON "expenses"("created_at");

-- CreateIndex
CREATE INDEX "payments_paid_at_idx" ON "payments"("paid_at");

-- CreateIndex
CREATE INDEX "payments_created_at_idx" ON "payments"("created_at");
