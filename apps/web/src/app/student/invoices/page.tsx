"use client";

import { useCallback, useMemo } from "react";
import { Loader2, Wallet } from "lucide-react";

import { Badge, EmptyState, ErrorState, PageHeader, SectionCard } from "@nexsmsid/ui";

import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  notes?: string | null;
  items?: { id: string; description: string; amount: number; paymentCategory?: { name: string } | null }[];
  academicYear?: { name: string } | null;
  semester?: { name: string } | null;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

const STATUS_VARIANT: Record<string, "success" | "warning" | "outline" | "secondary" | "outline"> = {
  PAID: "success",
  PARTIAL: "warning",
  OVERDUE: "outline",
  ISSUED: "outline",
  CANCELLED: "secondary",
};

const STATUS_LABEL: Record<string, string> = {
  PAID: "Lunas",
  PARTIAL: "Sebagian",
  OVERDUE: "Jatuh Tempo",
  ISSUED: "Diterbitkan",
  CANCELLED: "Dibatalkan",
};

export default function StudentInvoicesPage() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const loadInvoices = useCallback(() => api.getStudentPortalInvoices() as Promise<Invoice[]>, [api]);
  const { data: itemsData, error, loading } = useApiQuery(loadInvoices, [api]);
  const items = itemsData ?? [];

  if (loading)
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  if (error) return <ErrorState message={error} title="Gagal memuat tagihan" />;
  if (items.length === 0) return <EmptyState description="Belum ada tagihan." title="Belum ada tagihan" />;

  const outstanding = items.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount)), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Portal Siswa", "Tagihan"]}
        description={`Sisa tagihan aktif: ${formatRupiah(outstanding)}`}
        eyebrow="Portal Siswa"
        title="Tagihan SPP & Keuangan"
      />
      <SectionCard description={`${items.length} invoice`} title="Daftar Tagihan">
        <ul className="space-y-3">
          {items.map((inv) => {
            const remaining = Number(inv.total) - Number(inv.paidAmount);
            return (
              <li className="rounded-lg border border-border p-4" key={inv.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Wallet className="h-4 w-4 text-primary" /> {inv.invoiceNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Terbit {new Date(inv.issueDate).toLocaleDateString("id-ID")} • Jatuh tempo{" "}
                      {new Date(inv.dueDate).toLocaleDateString("id-ID")} • {inv.academicYear?.name ?? "-"} {inv.semester?.name ?? ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={STATUS_VARIANT[inv.status] ?? "secondary"}>{STATUS_LABEL[inv.status] ?? inv.status}</Badge>
                    <p className="mt-1 text-sm font-semibold text-foreground">{formatRupiah(Number(inv.total))}</p>
                    {remaining > 0 ? <p className="text-xs text-rose-600">Sisa {formatRupiah(remaining)}</p> : null}
                  </div>
                </div>
                {inv.items && inv.items.length > 0 ? (
                  <ul className="mt-3 space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
                    {inv.items.map((it) => (
                      <li className="flex items-center justify-between" key={it.id}>
                        <span>
                          {it.description} {it.paymentCategory?.name ? `(${it.paymentCategory.name})` : ""}
                        </span>
                        <span className="font-semibold text-muted-foreground">{formatRupiah(Number(it.amount))}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </div>
  );
}
