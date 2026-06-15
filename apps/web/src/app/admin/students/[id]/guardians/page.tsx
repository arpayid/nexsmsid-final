"use client";

import { ArrowLeft, Loader2, Plus, RefreshCcw, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useMemo, useState } from "react";

import { Button, DataTable, ErrorState, FormModal, PageHeader, SectionCard } from "@nexsmsid/ui";

import { EntityPicker } from "@/components/entity-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { createBrowserApiClient } from "@/lib/api-client";

type GuardianLink = {
  studentId: string;
  guardianId: string;
  isPrimary: boolean;
  guardian?: { id: string; name: string; phone?: string | null; email?: string | null };
};

type GuardiansPageData = {
  studentName: string;
  items: GuardianLink[];
};

export default function StudentGuardiansPage() {
  const { id: studentId } = useParams<{ id: string }>();
  const client = useMemo(() => createBrowserApiClient(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [student, guardians] = await Promise.all([client.getStudent(studentId), client.listStudentGuardians(studentId)]);
    return { studentName: String(student.name ?? ""), items: guardians as GuardianLink[] };
  }, [client, studentId]);

  const { data, error: fetchError, loading, refetch } = useApiQuery<GuardiansPageData>(loadData, [client, studentId]);
  const studentName = data?.studentName ?? "";
  const items = data?.items ?? [];
  const error = actionError ?? fetchError;

  async function handleLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);
    const formData = new FormData(event.currentTarget);
    try {
      await client.linkStudentGuardian(studentId, {
        guardianId: formData.get("guardianId") as string,
        isPrimary: formData.get("isPrimary") === "on",
      });
      setFormOpen(false);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menambah wali");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetPrimary(guardianId: string) {
    setActionBusy(guardianId);
    setActionError(null);
    try {
      await client.updateStudentGuardianLink(studentId, guardianId, { isPrimary: true });
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal mengatur wali utama");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleUnlink(guardianId: string) {
    if (!window.confirm("Hapus hubungan wali ini?")) return;
    setActionBusy(guardianId);
    setActionError(null);
    try {
      await client.unlinkStudentGuardian(studentId, guardianId);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus wali");
    } finally {
      setActionBusy(null);
    }
  }

  const columns = [
    { key: "name", header: "Nama Wali", cell: (item: GuardianLink) => item.guardian?.name ?? item.guardianId },
    { key: "phone", header: "Telepon", cell: (item: GuardianLink) => item.guardian?.phone ?? "-" },
    { key: "email", header: "Email", cell: (item: GuardianLink) => item.guardian?.email ?? "-" },
    {
      key: "isPrimary",
      header: "Utama",
      cell: (item: GuardianLink) => (item.isPrimary ? "Ya" : "Tidak"),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/students">
                <ArrowLeft className="h-4 w-4" /> Kembali
              </Link>
            </Button>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Tambah Wali
            </Button>
          </>
        }
        breadcrumb={["Admin", "Siswa", studentName || studentId, "Wali"]}
        description="Kelola hubungan siswa dengan wali murid."
        title={`Wali — ${studentName || "Siswa"}`}
      />

      {error ? <ErrorState message={error} title="Terjadi Kesalahan" /> : null}

      <SectionCard title="Daftar Wali Terhubung">
        <DataTable
          actions={(item) => (
            <>
              {!item.isPrimary ? (
                <Button
                  disabled={actionBusy === item.guardianId}
                  onClick={() => void handleSetPrimary(item.guardianId)}
                  size="sm"
                  variant="soft"
                >
                  <Star className="h-4 w-4" /> Jadikan Utama
                </Button>
              ) : null}
              <Button
                disabled={actionBusy === item.guardianId}
                onClick={() => void handleUnlink(item.guardianId)}
                size="sm"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4" /> Hapus
              </Button>
            </>
          )}
          columns={columns}
          data={items}
          getRowId={(item) => item.guardianId}
          loading={loading}
          emptyState={{ title: "Belum ada wali", description: "Tambahkan wali murid untuk siswa ini." }}
        />
      </SectionCard>

      <FormModal hideOverlay onClose={() => setFormOpen(false)} open={formOpen} title="Tambah Wali">
        <form className="space-y-4" onSubmit={handleLink}>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-muted-foreground">Wali Murid</span>
            <EntityPicker entityType="guardian" name="guardianId" placeholder="Cari wali..." required />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <input className="h-4 w-4 rounded border-input" name="isPrimary" type="checkbox" />
            Jadikan wali utama
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
    </div>
  );
}
