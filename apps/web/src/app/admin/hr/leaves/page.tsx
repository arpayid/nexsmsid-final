"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { PageHeader, SectionCard, DataTable, Button, ErrorState, FormModal, Input } from "@nexsmsid/ui";
import { createBrowserApiClient } from "@/lib/api-client";
import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { Loader2, Plus, RefreshCcw } from "lucide-react";

type LeaveRequestRow = {
  id: string;
  employeeId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  status?: string;
  employee?: { fullName?: string };
};

export default function Page() {
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const client = useMemo(() => createBrowserApiClient(), []);

  const loadItems = useCallback(async () => {
    const response = await client.listLeaveRequests({ limit: 50, page: 1 });
    return (response as { data?: LeaveRequestRow[] }).data || [];
  }, [client]);
  const { data: itemsData, error: fetchError, loading, refetch } = useApiQuery<LeaveRequestRow[]>(loadItems, [client]);
  const items = itemsData ?? [];
  const error = actionError ?? fetchError;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);
    const formData = new FormData(event.currentTarget);
    const payload = {
      employeeId: formData.get("employeeId") as string,
      type: formData.get("type") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      reason: formData.get("reason") as string,
    };

    try {
      await client.createLeaveRequest(payload);
      setFormOpen(false);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menyimpan pengajuan cuti");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: string) {
    setActionBusy(id);
    setActionError(null);
    try {
      await client.approveLeaveRequest(id);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menyetujui cuti");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleReject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rejectingId) return;
    setSubmitting(true);
    setActionError(null);
    const formData = new FormData(event.currentTarget);
    try {
      await client.rejectLeaveRequest(rejectingId, {
        rejectionReason: formData.get("rejectionReason") as string,
      });
      setRejectOpen(false);
      setRejectingId(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menolak cuti");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    setActionBusy(id);
    setActionError(null);
    try {
      await client.cancelLeaveRequest(id);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal membatalkan cuti");
    } finally {
      setActionBusy(null);
    }
  }

  const columns = [
    { key: "employee", header: "Pegawai", cell: (item: LeaveRequestRow) => String(item.employee?.fullName ?? item.employeeId ?? "-") },
    { key: "type", header: "Tipe", cell: (item: LeaveRequestRow) => String(item.type ?? "-") },
    { key: "period", header: "Periode", cell: (item: LeaveRequestRow) => `${formatDate(item.startDate)} - ${formatDate(item.endDate)}` },
    { key: "totalDays", header: "Hari", cell: (item: LeaveRequestRow) => String(item.totalDays ?? "-") },
    { key: "status", header: "Status", cell: (item: LeaveRequestRow) => String(item.status ?? "-") },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cuti & Izin"
        description="Manajemen cuti & izin."
        breadcrumb={["Admin", "HR & Payroll", "Cuti & Izin"]}
        actions={
          <>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </>
        }
      />

      {error ? <ErrorState message={error} title="Terjadi Kesalahan" /> : null}

      <SectionCard title="Daftar Cuti & Izin">
        <DataTable
          actions={(item) => (
            <>
              {item.status === "PENDING" ? (
                <>
                  <Button disabled={actionBusy === item.id} onClick={() => void handleApprove(item.id)} size="sm" variant="soft">
                    {actionBusy === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Setujui
                  </Button>
                  <Button
                    onClick={() => {
                      setRejectingId(item.id);
                      setRejectOpen(true);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Tolak
                  </Button>
                </>
              ) : null}
              {item.status === "PENDING" || item.status === "APPROVED" ? (
                <Button disabled={actionBusy === item.id} onClick={() => void handleCancel(item.id)} size="sm" variant="ghost">
                  Batalkan
                </Button>
              ) : null}
            </>
          )}
          columns={columns}
          data={items}
          loading={loading}
          getRowId={(item) => item.id}
          emptyState={{
            title: "Data kosong",
            description: "Belum ada data cuti & izin.",
          }}
        />
      </SectionCard>

      <FormModal hideOverlay onClose={() => setFormOpen(false)} open={formOpen} title="Tambah Pengajuan Cuti">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Pegawai</span>
            <EntityPicker entityType="employee" name="employeeId" placeholder="Cari pegawai..." required />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Tipe</span>
            <select
              className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              name="type"
              defaultValue="ANNUAL"
            >
              <option value="ANNUAL">Cuti Tahunan</option>
              <option value="SICK">Sakit</option>
              <option value="MARRIAGE">Menikah</option>
              <option value="MATERNITY">Melahirkan</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Mulai</span>
              <Input name="startDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Selesai</span>
              <Input name="endDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Alasan</span>
            <textarea
              className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              name="reason"
              required
              rows={3}
              placeholder="Jelaskan alasan cuti..."
            />
          </label>
          <div className="flex gap-3 pt-2">
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
            </Button>
            <Button onClick={() => setFormOpen(false)} type="button" variant="outline">
              Batal
            </Button>
          </div>
        </form>
      </FormModal>

      <FormModal
        hideOverlay
        onClose={() => {
          setRejectOpen(false);
          setRejectingId(null);
        }}
        open={rejectOpen}
        title="Tolak Pengajuan Cuti"
      >
        <form className="space-y-4" onSubmit={handleReject}>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Alasan Penolakan</span>
            <textarea
              className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              name="rejectionReason"
              required
              rows={3}
              placeholder="Jelaskan alasan penolakan..."
            />
          </label>
          <div className="flex gap-3 pt-2">
            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Tolak
            </Button>
            <Button
              onClick={() => {
                setRejectOpen(false);
                setRejectingId(null);
              }}
              type="button"
              variant="outline"
            >
              Batal
            </Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}

function formatDate(value: unknown) {
  return value ? new Date(String(value)).toLocaleDateString("id-ID") : "-";
}
