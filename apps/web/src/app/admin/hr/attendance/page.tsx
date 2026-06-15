"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCcw } from "lucide-react";

import { Button, DataTable, ErrorState, FormModal, Input, PageHeader, SectionCard } from "@nexsmsid/ui";
import { createBrowserApiClient } from "@/lib/api-client";
import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";

type AttendanceRow = {
  id: string;
  employeeId?: string;
  date?: string;
  status?: string;
  checkInAt?: string;
  checkOutAt?: string;
  lateMinutes?: number;
  employee?: { fullName?: string };
};

export default function Page() {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(async () => {
    const response = await api.listEmployeeAttendance({ limit: 50, page: 1 });
    return (response as { data?: AttendanceRow[] }).data || [];
  }, [api]);
  const { data: itemsData, error: fetchError, loading, refetch } = useApiQuery<AttendanceRow[]>(loadItems, [api]);
  const items = itemsData ?? [];
  const error = actionError ?? fetchError;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);
    const formData = new FormData(event.currentTarget);
    const payload = {
      employeeId: formData.get("employeeId") as string,
      date: formData.get("date") as string,
      status: formData.get("status") as string,
      checkInAt: formData.get("checkInAt") ? `${formData.get("date")}T${formData.get("checkInAt")}:00.000Z` : undefined,
      checkOutAt: formData.get("checkOutAt") ? `${formData.get("date")}T${formData.get("checkOutAt")}:00.000Z` : undefined,
    };

    try {
      await api.createEmployeeAttendance(payload);
      setFormOpen(false);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal mencatat kehadiran");
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    { key: "date", header: "Tanggal", cell: (item: AttendanceRow) => formatDate(item.date) },
    { key: "employee", header: "Pegawai", cell: (item: AttendanceRow) => String(item.employee?.fullName ?? item.employeeId ?? "-") },
    { key: "status", header: "Status", cell: (item: AttendanceRow) => String(item.status ?? "-") },
    { key: "checkInAt", header: "Masuk", cell: (item: AttendanceRow) => formatTime(item.checkInAt) },
    { key: "checkOutAt", header: "Pulang", cell: (item: AttendanceRow) => formatTime(item.checkOutAt) },
    { key: "lateMinutes", header: "Terlambat", cell: (item: AttendanceRow) => `${Number(item.lateMinutes ?? 0)} menit` },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Kehadiran Pegawai"
        description="Rekap presensi pegawai dan staf."
        breadcrumb={["Admin", "HR & Payroll", "Kehadiran"]}
        actions={
          <>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Catat Kehadiran
            </Button>
          </>
        }
      />

      {error ? <ErrorState message={error} title="Terjadi Kesalahan" /> : null}

      <SectionCard title="Daftar Kehadiran Pegawai">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          getRowId={(item) => item.id}
          emptyState={{ title: "Data kosong", description: "Belum ada catatan kehadiran pegawai." }}
        />
      </SectionCard>

      <FormModal hideOverlay onClose={() => setFormOpen(false)} open={formOpen} title="Catat Kehadiran">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Pegawai</span>
            <EntityPicker entityType="employee" name="employeeId" placeholder="Cari pegawai..." required />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Tanggal</span>
            <Input name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Status</span>
            <select
              className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              name="status"
              defaultValue="PRESENT"
            >
              <option value="PRESENT">Hadir</option>
              <option value="ABSENT">Alpa</option>
              <option value="LATE">Terlambat</option>
              <option value="PERMIT">Izin</option>
              <option value="SICK">Sakit</option>
              <option value="OFF">Libur</option>
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Jam Masuk</span>
              <Input name="checkInAt" type="time" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-muted-foreground">Jam Pulang</span>
              <Input name="checkOutAt" type="time" />
            </label>
          </div>
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
    </div>
  );
}

function formatDate(value: unknown) {
  return value ? new Date(String(value)).toLocaleDateString("id-ID") : "-";
}

function formatTime(value: unknown) {
  return value ? new Date(String(value)).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-";
}
