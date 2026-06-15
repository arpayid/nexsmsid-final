import type { createBrowserApiClient } from "@/lib/api-client";

export type EntityType =
  | "student"
  | "teacher"
  | "guardian"
  | "staff"
  | "classroom"
  | "subject"
  | "competency"
  | "department"
  | "academic-year"
  | "semester"
  | "discipline-rule"
  | "discipline-violation"
  | "counseling-case"
  | "library-member"
  | "library-copy"
  | "library-book"
  | "industry-partner"
  | "alumni"
  | "room"
  | "user"
  | "teaching-assignment"
  | "invoice"
  | "lesson-hour"
  | "employee"
  | "hr-position"
  | "exam-type"
  | "exam-room"
  | "schedule"
  | "inventory-item"
  | "inventory-location"
  | "inventory-category";

export type EntityOption = { id: string; label: string };

type Api = ReturnType<typeof createBrowserApiClient>;

export async function searchEntities(api: Api, entityType: EntityType, search: string, limit = 20): Promise<EntityOption[]> {
  const query = search.trim();

  switch (entityType) {
    case "student": {
      const res = await api.listStudents({ search: query || undefined, limit, page: 1 });
      return res.items.map((item) => ({
        id: item.id,
        label: [item.name, item.nis ? `NIS ${item.nis}` : null].filter(Boolean).join(" — "),
      }));
    }
    case "teacher": {
      const res = await api.listTeachers({ search: query || undefined, limit, page: 1 });
      return res.items.map((item) => ({
        id: item.id,
        label: [item.name, item.nip ? `NIP ${item.nip}` : null].filter(Boolean).join(" — "),
      }));
    }
    case "guardian": {
      const res = await api.listGuardians({ search: query || undefined, limit, page: 1 });
      return res.items.map((item) => ({
        id: item.id,
        label: [item.name, item.phone].filter(Boolean).join(" — "),
      }));
    }
    case "staff": {
      const res = await api.listStaffs({ search: query || undefined, limit, page: 1 });
      return res.items.map((item) => ({ id: item.id, label: item.name }));
    }
    case "classroom": {
      const res = await api.masterDataList("classrooms", { search: query || undefined, limit, page: 1 });
      return res.data.map((item) => ({
        id: item.id,
        label: [item.name, item.code].filter(Boolean).join(" — "),
      }));
    }
    case "subject": {
      const res = await api.masterDataList("subjects", { search: query || undefined, limit, page: 1 });
      return res.data.map((item) => ({
        id: item.id,
        label: [item.name, item.code].filter(Boolean).join(" — "),
      }));
    }
    case "competency": {
      const res = await api.masterDataList("competencies", { search: query || undefined, limit, page: 1 });
      return res.data.map((item) => ({ id: item.id, label: String(item.name ?? item.code ?? item.id) }));
    }
    case "department": {
      const res = await api.masterDataList("departments", { search: query || undefined, limit, page: 1 });
      return res.data.map((item) => ({ id: item.id, label: String(item.name ?? item.code ?? item.id) }));
    }
    case "academic-year": {
      const res = await api.masterDataList("academic-years", { search: query || undefined, limit, page: 1 });
      return res.data.map((item) => ({ id: item.id, label: String(item.name ?? item.id) }));
    }
    case "semester": {
      const res = await api.masterDataList("semesters", { search: query || undefined, limit, page: 1 });
      return res.data.map((item) => ({ id: item.id, label: String(item.name ?? item.id) }));
    }
    case "discipline-rule": {
      const res = await api.listDisciplineRules({ search: query || undefined, limit, page: 1 });
      return res.items.map((item) => ({
        id: item.id as string,
        label: [item.name, item.code].filter(Boolean).join(" — "),
      }));
    }
    case "library-member": {
      const res = await api.listLibraryMembers({ search: query || undefined, limit, page: 1 });
      const rows = res.data ?? [];
      return rows.map((item) => ({
        id: String(item.id),
        label: [item.externalName ?? item.student?.name ?? item.teacher?.name, item.memberCode ? `#${item.memberCode}` : null]
          .filter(Boolean)
          .join(" — "),
      }));
    }
    case "library-copy": {
      const res = await api.listAllLibraryCopies({ search: query || undefined, limit, page: 1 });
      const rows = res.data ?? [];
      return rows.map((item) => ({
        id: String(item.id),
        label: [item.copyCode, item.book?.title].filter(Boolean).join(" — "),
      }));
    }
    case "industry-partner": {
      const res = await api.listIndustryPartners({ search: query || undefined, limit, page: 1 });
      return res.items.map((item) => ({ id: String(item.id), label: String(item.name ?? item.id) }));
    }
    case "alumni": {
      const res = await api.listAlumni({ search: query || undefined, limit, page: 1 });
      return res.items.map((item) => ({
        id: String(item.id),
        label: [item.name, item.graduationYear ? `Lulus ${item.graduationYear}` : null].filter(Boolean).join(" — "),
      }));
    }
    case "library-book": {
      const rows = (await api.listLibraryBooks({ search: query || undefined, limit, page: 1 })) as
        | Array<Record<string, unknown>>
        | { data?: Array<Record<string, unknown>> };
      const items = Array.isArray(rows) ? rows : (rows.data ?? []);
      return items.map((item) => ({
        id: String(item.id),
        label: [item.title, item.isbn ? `ISBN ${item.isbn}` : null].filter(Boolean).join(" — "),
      }));
    }
    case "room": {
      const res = await api.masterDataList("rooms", { search: query || undefined, limit, page: 1 });
      return res.data.map((item) => ({
        id: item.id,
        label: [item.name, item.code].filter(Boolean).join(" — "),
      }));
    }
    case "counseling-case": {
      const res = await api.listCounselingCases({ search: query || undefined, limit, page: 1 });
      return res.items.map((item) => ({
        id: String(item.id),
        label: [item.title, item.student?.name].filter(Boolean).join(" — "),
      }));
    }
    case "discipline-violation": {
      const res = await api.listDisciplineViolations({ search: query || undefined, limit, page: 1 });
      return res.items.map((item) => ({
        id: String(item.id),
        label: [item.student?.name, item.status].filter(Boolean).join(" — "),
      }));
    }
    case "user": {
      const response = await api.users();
      const items = (response.data ?? []) as Array<{ id: string; name: string; email?: string | null }>;
      const filtered = query
        ? items.filter((item) => [item.name, item.email].filter(Boolean).join(" ").toLowerCase().includes(query.toLowerCase()))
        : items;
      return filtered.slice(0, limit).map((item) => ({
        id: item.id,
        label: [item.name, item.email].filter(Boolean).join(" — "),
      }));
    }
    case "teaching-assignment": {
      const res = await api.listTeachingAssignments({ search: query || undefined, limit, page: 1 });
      return res.data.map((item) => ({
        id: item.id,
        label: [item.teacher?.name, item.subject?.name, item.classroom?.name].filter(Boolean).join(" — "),
      }));
    }
    case "invoice": {
      const res = await api.listInvoices({ search: query || undefined, limit, page: 1 });
      return res.items.map((item) => ({
        id: item.id,
        label: [item.invoiceNumber, item.student?.name].filter(Boolean).join(" — "),
      }));
    }
    case "lesson-hour": {
      const res = await api.masterDataList("lesson-hours", { search: query || undefined, limit, page: 1 });
      return res.data.map((item) => ({
        id: item.id,
        label: [item.name, item.code].filter(Boolean).join(" — "),
      }));
    }
    case "employee": {
      const res = await api.listEmployees({ search: query || undefined, limit, page: 1 });
      return res.data.map((item: Record<string, unknown>) => ({
        id: String(item.id),
        label: [item.fullName, item.employeeCode ? `#${item.employeeCode}` : null].filter(Boolean).join(" — "),
      }));
    }
    case "hr-position": {
      const res = await api.listHRPositions({ search: query || undefined, limit, page: 1 });
      return res.data.map((item: Record<string, unknown>) => ({
        id: String(item.id),
        label: [item.name, item.code].filter(Boolean).join(" — "),
      }));
    }
    case "exam-type": {
      const res = await api.listExamTypes({ search: query || undefined, limit, page: 1 });
      return res.data.map((item: Record<string, unknown>) => ({
        id: String(item.id),
        label: String(item.name ?? item.id),
      }));
    }
    case "exam-room": {
      const res = await api.listExamRooms({ search: query || undefined, limit, page: 1 });
      return res.data.map((item: Record<string, unknown>) => ({
        id: String(item.id),
        label: [item.name, item.code].filter(Boolean).join(" — "),
      }));
    }
    case "schedule": {
      const res = await api.listSchedules({ search: query || undefined, limit, page: 1 });
      const items = Array.isArray(res.data) ? res.data : [];
      return items.map((item) => ({
        id: item.id,
        label: [item.dayOfWeek, item.lessonHour?.name, item.teachingAssignment?.subject?.name, item.teachingAssignment?.classroom?.name]
          .filter(Boolean)
          .join(" — "),
      }));
    }
    case "inventory-item": {
      const res = (await api.getInventoryItems({ search: query || undefined, limit, page: 1 })) as
        | Array<Record<string, unknown>>
        | { data?: Array<Record<string, unknown>> };
      const items = Array.isArray(res) ? res : (res.data ?? []);
      return items.map((item) => ({
        id: String(item.id),
        label: [item.name, item.code].filter(Boolean).join(" — "),
      }));
    }
    case "inventory-location": {
      const rows = (await api.getInventoryLocations()) as Array<Record<string, unknown>>;
      const filtered = query
        ? rows.filter((item) =>
            String(item.name ?? "")
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
        : rows;
      return filtered.slice(0, limit).map((item) => ({
        id: String(item.id),
        label: String(item.name ?? item.id),
      }));
    }
    case "inventory-category": {
      const rows = (await api.getInventoryCategories()) as Array<Record<string, unknown>>;
      const filtered = query
        ? rows.filter((item) =>
            String(item.name ?? "")
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
        : rows;
      return filtered.slice(0, limit).map((item) => ({
        id: String(item.id),
        label: String(item.name ?? item.id),
      }));
    }
    default:
      return [];
  }
}

export const ENTITY_FILTER_MAP: Partial<Record<string, EntityType>> = {
  studentId: "student",
  teacherId: "teacher",
  guardianId: "guardian",
  staffId: "staff",
  classroomId: "classroom",
  subjectId: "subject",
  competencyId: "competency",
  departmentId: "department",
  academicYearId: "academic-year",
  semesterId: "semester",
  ruleId: "discipline-rule",
  memberId: "library-member",
  copyId: "library-copy",
  industryPartnerId: "industry-partner",
  alumniId: "alumni",
  bookId: "library-book",
  roomId: "room",
  supervisorTeacherId: "teacher",
  responsibleUserId: "user",
  relatedCounselingCaseId: "counseling-case",
  relatedDisciplineViolationId: "discipline-violation",
  recipientId: "user",
  userId: "user",
  counselorId: "user",
  teachingAssignmentId: "teaching-assignment",
  invoiceId: "invoice",
  lessonHourId: "lesson-hour",
  employeeId: "employee",
  positionId: "hr-position",
  examTypeId: "exam-type",
  itemId: "inventory-item",
  fromLocationId: "inventory-location",
  toLocationId: "inventory-location",
  locationId: "inventory-location",
  categoryId: "inventory-category",
};
