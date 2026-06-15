"use client";

import { Phase9ResourcePage, options, statusMap } from "@/components/phase9-resource-page";
import { createBrowserApiClient } from "@/lib/api-client";

const statuses = ["SUBMITTED", "REVIEWED", "INTERVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"];

export default function BkkApplicationsPage() {
  return (
    <Phase9ResourcePage
      breadcrumb={["Admin", "BKK", "Lamaran"]}
      columns={[
        { key: "applicantName", label: "Pelamar" },
        { key: "applicantEmail", label: "Email" },
        { key: "jobVacancy.title", label: "Lowongan" },
        { key: "jobVacancy.companyName", label: "Perusahaan" },
        { key: "status", label: "Status" },
      ]}
      description="Kelola lamaran pekerjaan dari halaman publik."
      eyebrow="BKK"
      fields={[
        { name: "applicantName", label: "Nama Pelamar", required: true },
        { name: "applicantEmail", label: "Email" },
        { name: "applicantPhone", label: "Telepon" },
        { name: "status", label: "Status", type: "select", options: options(statuses) },
        { name: "note", label: "Catatan", type: "textarea" },
      ]}
      load={(api, params) => api.listJobApplications(params)}
      rowActions={[
        {
          label: "Unduh CV",
          show: (row) => Boolean(row.cvUrl),
          run: async (_api, row) => {
            const api = createBrowserApiClient();
            const filename =
              String(row.cvUrl ?? "cv.pdf")
                .split("/")
                .pop() ?? "cv.pdf";
            const blob = await api.downloadJobApplicationCv(row.id as string, filename);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = filename;
            anchor.click();
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
          },
        },
        { label: "Review", run: (api, row) => api.reviewJobApplication(row.id as string), show: (row) => row.status === "SUBMITTED" },
        {
          label: "Accept",
          run: (api, row) => api.acceptJobApplication(row.id as string),
          show: (row) => ["SUBMITTED", "REVIEWED", "INTERVIEW"].includes(row.status as string),
        },
        {
          label: "Reject",
          run: (api, row) => api.rejectJobApplication(row.id as string, { note: "Ditolak dari UI admin" }),
          show: (row) => ["SUBMITTED", "REVIEWED", "INTERVIEW"].includes(row.status as string),
          variant: "ghost",
        },
      ]}
      statusMap={statusMap(statuses)}
      statusOptions={options(statuses)}
      title="Lamaran Kerja"
      update={(api, id, input) => api.updateJobApplication(id, input)}
    />
  );
}
