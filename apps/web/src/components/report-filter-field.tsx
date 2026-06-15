"use client";

import { Input } from "@nexsmsid/ui";

import { EntityPicker } from "@/components/entity-picker";
import { ENTITY_FILTER_MAP } from "@/lib/entity-picker-config";

type Option = { id: string; name?: string; code?: string };

type ReportFilterFieldProps = {
  filterKey: string;
  label: string;
  options?: Option[];
  required?: boolean;
};

const FILTER_LABELS: Record<string, string> = {
  academicYearId: "Tahun Akademik",
  semesterId: "Semester",
  classroomId: "Kelas",
  studentId: "Siswa",
  teacherId: "Guru",
  subjectId: "Mata Pelajaran",
  departmentId: "Jurusan",
  industryPartnerId: "Mitra Industri",
  startDate: "Tanggal Mulai",
  endDate: "Tanggal Selesai",
  status: "Status",
  year: "Tahun",
  channel: "Channel",
  severity: "Tingkat",
  graduationYear: "Tahun Lulus",
};

export function getReportFilterLabel(key: string) {
  return (
    FILTER_LABELS[key] ??
    key
      .replace(/Id$/, "")
      .replace(/([A-Z])/g, " $1")
      .trim()
  );
}

export function ReportFilterField({ filterKey, label, options, required }: ReportFilterFieldProps) {
  if (filterKey === "startDate" || filterKey === "endDate") {
    return (
      <label className="block space-y-1.5">
        <span className="text-xs font-bold text-muted-foreground">{label}</span>
        <Input name={filterKey} required={required} type="date" />
      </label>
    );
  }

  if (filterKey === "year" || filterKey === "graduationYear") {
    return (
      <label className="block space-y-1.5">
        <span className="text-xs font-bold text-muted-foreground">{label}</span>
        <Input name={filterKey} required={required} type="number" />
      </label>
    );
  }

  const entityType = ENTITY_FILTER_MAP[filterKey];
  if (entityType) {
    return (
      <label className="block space-y-1.5">
        <span className="text-xs font-bold text-muted-foreground">{label}</span>
        <EntityPicker entityType={entityType} name={filterKey} placeholder={`Pilih ${label.toLowerCase()}...`} required={required} />
      </label>
    );
  }

  if (options?.length) {
    return (
      <label className="block space-y-1.5">
        <span className="text-xs font-bold text-muted-foreground">{label}</span>
        <select
          className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold text-muted-foreground"
          name={filterKey}
          required={required}
        >
          <option value="">Pilih...</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name ?? option.code ?? option.id}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (filterKey === "status") {
    return (
      <label className="block space-y-1.5">
        <span className="text-xs font-bold text-muted-foreground">{label}</span>
        <select
          className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold text-muted-foreground"
          name={filterKey}
        >
          <option value="">Semua Status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Tidak Aktif</option>
          <option value="PAID">Lunas</option>
          <option value="PENDING">Pending</option>
        </select>
      </label>
    );
  }

  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      <Input name={filterKey} placeholder={label} required={required} />
    </label>
  );
}
