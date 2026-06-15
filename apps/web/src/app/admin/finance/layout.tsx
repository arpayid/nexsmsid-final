"use client";

import { usePathname } from "next/navigation";

import { PermissionGate } from "@/components/permission-gate";

function resolveFinancePermission(pathname: string): string {
  if (pathname.startsWith("/admin/finance/invoices")) return "invoices.view";
  if (pathname.startsWith("/admin/finance/payments")) return "payments.view";
  if (pathname.startsWith("/admin/finance/expenses")) return "expenses.view";
  if (pathname.startsWith("/admin/finance/reports")) return "reports.view";
  return "finance.view";
}

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <PermissionGate permission={resolveFinancePermission(pathname)}>{children}</PermissionGate>;
}
