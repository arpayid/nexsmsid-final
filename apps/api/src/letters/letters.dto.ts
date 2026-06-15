import { z } from "zod";

const optionalString = z.preprocess((value) => (value === "" ? undefined : value), z.string().trim().min(1).optional());
const optionalText = z.preprocess((value) => (value === "" ? undefined : value), z.string().trim().optional());
const optionalDate = z.preprocess((value) => (value === "" ? undefined : value), z.coerce.date().optional());
const optionalBoolean = z.preprocess((value) => {
  if (value === "") return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean().optional());

const optionalJson = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) return undefined;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}, z.unknown().optional());

export const letterDirectionSchema = z.enum(["INCOMING", "OUTGOING", "INTERNAL"]);
export const letterStatusSchema = z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "ISSUED", "ARCHIVED", "CANCELLED"]);
export const letterPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
export const letterRecipientTypeSchema = z.enum(["STUDENT", "GUARDIAN", "TEACHER", "STAFF", "USER", "EXTERNAL"]);
export const letterTemplateStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const listLetterTemplatesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: optionalString,
  category: optionalString,
  status: letterTemplateStatusSchema.optional(),
});

export const createLetterTemplateSchema = z.object({
  code: z.string().trim().min(1, "Code is required"),
  name: z.string().trim().min(1, "Name is required"),
  description: optionalText,
  category: z.string().trim().min(1, "Category is required"),
  status: letterTemplateStatusSchema.default("ACTIVE"),
  subjectTemplate: z.string().trim().min(1, "Subject template is required"),
  bodyTemplate: z.string().trim().min(1, "Body template is required"),
  variables: optionalJson,
  requiresApproval: optionalBoolean.default(false),
});

export const updateLetterTemplateSchema = createLetterTemplateSchema.partial();

export const listLettersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: optionalString,
  status: letterStatusSchema.optional(),
  direction: letterDirectionSchema.optional(),
  priority: letterPrioritySchema.optional(),
  category: optionalString,
  recipientType: letterRecipientTypeSchema.optional(),
  studentId: optionalString,
  guardianId: optionalString,
  teacherId: optionalString,
  staffId: optionalString,
  createdById: optionalString,
  startDate: optionalDate,
  endDate: optionalDate,
});

export const createLetterSchema = z.object({
  templateId: optionalString,
  subject: z.string().trim().min(1, "Subject is required"),
  body: z.string().trim().min(1, "Body is required"),
  direction: letterDirectionSchema.default("OUTGOING"),
  priority: letterPrioritySchema.default("NORMAL"),
  category: z.string().trim().min(1, "Category is required"),
  recipientType: letterRecipientTypeSchema,
  recipientName: z.string().trim().min(1, "Recipient name is required"),
  recipientEmail: optionalString,
  recipientAddress: optionalText,
  studentId: optionalString,
  guardianId: optionalString,
  teacherId: optionalString,
  staffId: optionalString,
  relatedCounselingCaseId: optionalString,
  relatedDisciplineViolationId: optionalString,
});

export const updateLetterSchema = z.object({
  templateId: optionalString,
  subject: optionalString,
  body: optionalText,
  direction: letterDirectionSchema.optional(),
  priority: letterPrioritySchema.optional(),
  category: optionalString,
  recipientType: letterRecipientTypeSchema.optional(),
  recipientName: optionalString,
  recipientEmail: optionalString,
  recipientAddress: optionalText,
  studentId: optionalString,
  guardianId: optionalString,
  teacherId: optionalString,
  staffId: optionalString,
  relatedCounselingCaseId: optionalString,
  relatedDisciplineViolationId: optionalString,
});

export const rejectLetterSchema = z.object({
  rejectionReason: z.string().trim().min(1, "Rejection reason is required"),
});

export const letterActionNoteSchema = z.object({
  note: optionalText,
});

export const numberPreviewSchema = z.object({
  category: z.string().trim().min(1, "Category is required"),
  date: optionalDate,
});
