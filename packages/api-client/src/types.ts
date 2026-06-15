export type ApiResponse<TData = unknown, TMeta = unknown> = {
  success: boolean;
  message: string;
  data: TData;
  meta?: TMeta;
};

export type ListMeta = {
  total?: number;
  page?: number;
  limit?: number;
};

export type PaginatedList<TItem> = {
  data: TItem[];
  meta?: ListMeta;
};

export type ListQueryParams = Record<string, string | number | boolean | undefined>;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  forceChangePassword?: boolean;
};

/** Browser session payload — JWTs are delivered via httpOnly cookies, not in the JSON body. */
export type AuthSession = {
  user: AuthUser;
  expiresIn: number;
  tokenType?: "Bearer";
  /** Present only in test/direct API clients when the server includes tokens in the body. */
  accessToken?: string;
  refreshToken?: string;
};

export type AuthTokens = AuthSession & {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
};

export type UserSummary = {
  id: string;
  email: string;
  username: string | null;
  name: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  roles: Array<{ id: string; name: string; slug: string }>;
};

export type RoleSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  permissions: Array<{ id: string; key: string; name: string; group: string }>;
};

export type PermissionSummary = {
  id: string;
  key: string;
  name: string;
  group: string;
  description: string | null;
};

export type DashboardSummary = {
  users: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  };
  roles: {
    total: number;
  };
  permissions: {
    total: number;
  };
  auditLogs: {
    total: number;
  };
  refreshTokens: {
    active: number;
  };
};

export type DashboardRoleSummary = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  totalUsers: number;
  activeUsers: number;
  totalPermissions: number;
};

export type DashboardRecentActivity = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: unknown;
  actor: {
    id: string;
    email: string;
    name: string;
  } | null;
  createdAt: string;
};

export type DashboardSystemStatus = {
  api: {
    status: string;
    version: string;
    uptime: number;
  };
  database: {
    provider: string;
    status: string;
  };
  redis: {
    configured: boolean;
    available: boolean;
    status: string;
    host?: string;
    port?: number;
  };
  generatedAt: string;
};

export type SchoolProfile = {
  id: string;
  name: string;
  npsn: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  principalName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MasterDataRecord = Record<string, unknown> & {
  id: string;
  code?: string;
  name: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type MasterDataListOptions = {
  limit?: number;
  page?: number;
  search?: string;
};

export type PersonStatus = "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED" | "RESIGNED";
export type Gender = "MALE" | "FEMALE";
export type EmploymentStatus = "PERMANENT" | "CONTRACT" | "HONORARY" | "PROBATION";
export type GuardianRelation = "FATHER" | "MOTHER" | "GUARDIAN" | "GRANDPARENT" | "SIBLING" | "OTHER";

export type ClassroomReference = {
  id: string;
  code: string;
  name: string;
  level: number;
};

export type StudentRecord = {
  id: string;
  nis: string;
  nisn: string | null;
  name: string;
  gender: Gender;
  birthPlace: string | null;
  birthDate: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  classroomId: string | null;
  classroom?: ClassroomReference | null;
  status: PersonStatus;
  photoUrl: string | null;
  enrolledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GuardianRecord = {
  id: string;
  name: string;
  relation: GuardianRelation;
  phone: string;
  email: string | null;
  occupation: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TeacherRecord = {
  id: string;
  nip: string | null;
  nuptk: string | null;
  name: string;
  gender: Gender;
  birthPlace: string | null;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  employmentStatus: EmploymentStatus;
  status: PersonStatus;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StaffRecord = {
  id: string;
  nip: string | null;
  name: string;
  gender: Gender;
  phone: string | null;
  email: string | null;
  address: string | null;
  position: string;
  department: string | null;
  employmentStatus: EmploymentStatus;
  status: PersonStatus;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PeopleListOptions = {
  classroomId?: string;
  limit?: number;
  page?: number;
  search?: string;
  status?: string;
};

// Phase 7 - Teaching Assignment, Schedule, Attendance, Grades
export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type AttendanceStatus = "PRESENT" | "SICK" | "PERMIT" | "ABSENT" | "LATE";
export type AssessmentType = "QUIZ" | "MID_EXAM" | "FINAL_EXAM" | "PRACTICE" | "ASSIGNMENT" | "PROJECT" | "OTHER";
export type GradeStatusType = "DRAFT" | "SUBMITTED" | "APPROVED" | "PUBLISHED";

export type TeachingAssignmentRecord = {
  id: string;
  teacherId: string;
  subjectId: string;
  classroomId: string;
  academicYearId: string;
  semesterId: string;
  isActive: boolean;
  teacher?: { id: string; name: string };
  subject?: { id: string; name: string; code: string };
  classroom?: { id: string; name: string; code: string };
  semester?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

export type ScheduleRecord = {
  id: string;
  teachingAssignmentId: string;
  dayOfWeek: DayOfWeek;
  lessonHourId: string;
  roomId: string | null;
  isActive: boolean;
  teachingAssignment: {
    id: string;
    teacher: { id: string; name: string };
    subject: { id: string; name: string; code: string };
    classroom: { id: string; name: string; code: string };
  };
  lessonHour: { id: string; name: string; startTime: string; endTime: string };
  room: { id: string; name: string; code: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceSessionRecord = {
  id: string;
  scheduleId: string;
  date: string;
  topic: string | null;
  notes: string | null;
  schedule?: {
    id: string;
    teachingAssignment: {
      teacher: { id: string; name: string };
      subject: { id: string; name: string; code: string };
      classroom: { id: string; name: string; code: string };
    };
    lessonHour: { id: string; name: string; startTime: string; endTime: string };
  };
  _count?: { records: number };
  createdAt: string;
  updatedAt: string;
};

export type AttendanceRecordRecord = {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  note: string | null;
  student?: { id: string; name: string; nis: string; nisn: string | null };
};

export type AttendanceSessionDetail = AttendanceSessionRecord & {
  schedule: {
    id: string;
    teachingAssignment: {
      teacher: { id: string; name: string };
      subject: { id: string; name: string; code: string };
      classroom: { id: string; name: string; code: string };
    };
    lessonHour: { id: string; name: string; startTime: string; endTime: string };
    room: { id: string; name: string; code: string } | null;
  };
  records: Array<{
    id: string;
    sessionId: string;
    studentId: string;
    status: AttendanceStatus;
    note: string | null;
    student: { id: string; name: string; nis: string; nisn: string | null };
  }>;
};

export type AttendanceClassroomSummary = {
  date: string;
  classroom: { id: string; name: string };
  totalStudents: number;
  present: number;
  sick: number;
  permit: number;
  absent: number;
  late: number;
  unrecorded: number;
  records: Array<{ student: { id: string; name: string; nis: string }; status: AttendanceStatus | null; notes: string | null }>;
};

export type AttendanceStudentSummary = {
  studentId: string;
  studentName: string;
  totalSessions: number;
  present: number;
  sick: number;
  permit: number;
  absent: number;
  late: number;
  attendanceRate: number;
};

export type AssessmentRecord = {
  id: string;
  teachingAssignmentId: string;
  name: string;
  type: AssessmentType;
  description: string | null;
  maxScore: number;
  weight: number;
  dueDate: string | null;
  teachingAssignment?: TeachingAssignmentRecord;
  _count?: { grades: number };
  createdAt: string;
  updatedAt: string;
};

export type GradeRecord = {
  id: string;
  assessmentId: string;
  studentId: string;
  score: number;
  status: GradeStatusType;
  student?: { id: string; name: string; nis: string };
};

export type AssessmentDetail = AssessmentRecord & {
  teachingAssignment: {
    id: string;
    teacher: { id: string; name: string };
    subject: { id: string; name: string; code: string };
    classroom: { id: string; name: string; code: string };
  };
  grades: Array<{
    id: string;
    assessmentId: string;
    studentId: string;
    score: number;
    notes: string | null;
    status: GradeStatusType;
    gradedAt: string | null;
    student: { id: string; name: string; nis: string; nisn: string | null };
  }>;
};

export type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  studentId: string;
  academicYearId?: string | null;
  semesterId?: string | null;
  issueDate: string;
  dueDate?: string | null;
  subtotal: number;
  discount: number;
  penalty: number;
  total: number;
  paidAmount: number;
  status: string;
  note?: string | null;
  student?: { id: string; name: string; nis: string };
  academicYear?: { id: string; name: string };
  semester?: { id: string; name: string };
  items?: Array<{ id: string; description: string; amount: number }>;
  createdAt: string;
  updatedAt: string;
};

export type PaymentRecord = {
  id: string;
  invoiceId?: string | null;
  paymentNumber: string;
  amount: number;
  method: string;
  status: string;
  paidAt?: string | null;
  note?: string | null;
  invoice?: { id: string; invoiceNumber: string; total: number };
  verifiedBy?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseRecord = {
  id: string;
  expenseNumber: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  status: string;
  approvedBy?: { id: string; name: string } | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceSummary = {
  totalInvoice: number;
  paidInvoice: number;
  pendingPayment: number;
  totalExpense: number;
  balance: number;
};

export type PpdbPeriodRecord = {
  id: string;
  name: string;
  academicYearId?: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  quota?: number | null;
  academicYear?: { id: string; name: string };
  _count?: { registrations: number };
  createdAt: string;
  updatedAt: string;
};

export type PpdbRegistrationRecord = {
  id: string;
  registrationNumber: string;
  periodId: string;
  name: string;
  gender: string;
  birthPlace?: string | null;
  birthDate?: string | null;
  address?: string | null;
  phone: string;
  email?: string | null;
  previousSchool?: string | null;
  selectedDepartmentId?: string | null;
  selectedCompetencyId?: string | null;
  status: string;
  selectionStatus: string;
  verifiedAt?: string | null;
  convertedStudentId?: string | null;
  note?: string | null;
  uploadToken?: string;
  period?: PpdbPeriodRecord;
  documents?: Array<{ id: string; name: string; status: string }>;
  createdAt: string;
  updatedAt: string;
};

export type IndustryPartnerRecord = {
  id: string;
  name: string;
  type?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;
  status: string;
  note?: string | null;
  _count?: { internships: number; jobVacancies: number };
  createdAt: string;
  updatedAt: string;
};

export type InternshipRecord = {
  id: string;
  studentId: string;
  industryPartnerId: string;
  academicYearId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  score?: number | null;
  note?: string | null;
  student?: { id: string; name: string; nis: string };
  industryPartner?: { id: string; name: string };
  logs?: InternshipLogRecord[];
  _count?: { logs: number };
  createdAt: string;
  updatedAt: string;
};

export type InternshipLogRecord = {
  id: string;
  internshipId: string;
  date: string;
  activity: string;
  status: string;
  note?: string | null;
  reviewedBy?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type AlumniRecord = {
  id: string;
  studentId?: string | null;
  name: string;
  graduationYear?: number | null;
  status: string;
  phone?: string | null;
  email?: string | null;
  currentEmployment?: string | null;
  student?: { id: string; name: string; nis: string };
  createdAt: string;
  updatedAt: string;
};

export type JobVacancyRecord = {
  id: string;
  industryPartnerId?: string | null;
  title: string;
  description?: string | null;
  requirements?: string | null;
  location?: string | null;
  type?: string | null;
  status: string;
  closeDate?: string | null;
  industryPartner?: { id: string; name: string };
  _count?: { applications: number };
  createdAt: string;
  updatedAt: string;
};

export type JobApplicationRecord = {
  id: string;
  jobVacancyId: string;
  name: string;
  phone: string;
  email?: string | null;
  status: string;
  note?: string | null;
  jobVacancy?: JobVacancyRecord;
  createdAt: string;
  updatedAt: string;
};

export type TracerStudyRecord = {
  id: string;
  alumniId?: string | null;
  status: string;
  employmentStatus?: string | null;
  company?: string | null;
  position?: string | null;
  salary?: string | null;
  note?: string | null;
  alumni?: AlumniRecord;
  createdAt: string;
  updatedAt: string;
};

export type BkkSummary = {
  totalPartners: number;
  totalVacancies: number;
  totalPlacements: number;
  activeAlumni: number;
  unemployedAlumni: number;
};

export type AnnouncementRecord = {
  id: string;
  title: string;
  content: string;
  status: string;
  publishAt?: string | null;
  archivedAt?: string | null;
  createdBy?: { id: string; name: string };
  _count?: { recipients: number };
  createdAt: string;
  updatedAt: string;
};

export type InternalMessageRecord = {
  id: string;
  subject: string;
  body: string;
  senderId: string;
  recipientId: string;
  readAt?: string | null;
  sender?: { id: string; name: string; email: string };
  recipient?: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
};

export type NotificationRecord = {
  id: string;
  userId: string;
  title: string;
  body?: string | null;
  type: string;
  status: string;
  readAt?: string | null;
  archivedAt?: string | null;
  channel?: string;
  createdAt: string;
};

export type NotificationTemplateRecord = {
  id: string;
  code: string;
  name: string;
  channel: string;
  subject?: string | null;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReportDefinitionRecord = {
  code: string;
  name: string;
  category: string;
  supportedFormats: string[];
  requiredFilters: string[];
  optionalFilters: string[];
  permissions: string[];
};

export type LoginHistoryRecord = {
  id: string;
  userId: string | null;
  email: string;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  reason: string | null;
  createdAt: string;
};

export type ReportJobRecord = {
  id: string;
  name: string;
  type: string;
  status: string;
  parameters?: unknown;
  resultUrl?: string | null;
  error?: string | null;
  requester?: { id: string; name: string };
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExportHistoryRecord = {
  id: string;
  type: string;
  status: string;
  format: string;
  parameters?: unknown;
  fileUrl?: string | null;
  error?: string | null;
  requester?: { id: string; name: string };
  completedAt?: string | null;
  createdAt: string;
};

export type ReportCenterSummary = {
  availableReports: Array<{ id: string; name: string; type: string }>;
  recentJobs: ReportJobRecord[];
  pendingJobs: number;
};

export type CounselingCaseRecord = {
  id: string;
  studentId: string;
  counselorId?: string | null;
  category: string;
  priority: string;
  status: string;
  title: string;
  description?: string | null;
  resolution?: string | null;
  followUpDate?: string | null;
  closedAt?: string | null;
  student?: { id: string; name: string; nis: string };
  counselor?: { id: string; name: string };
  notes?: CounselingNoteRecord[];
  _count?: { notes: number };
  createdAt: string;
  updatedAt: string;
};

export type CounselingNoteRecord = {
  id: string;
  caseId: string;
  note: string;
  visibility?: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
};

export type DisciplineRuleRecord = {
  id: string;
  code: string;
  name: string;
  severity: string;
  point: number;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DisciplineViolationRecord = {
  id: string;
  studentId: string;
  ruleId: string;
  reportedById: string;
  confirmedById?: string | null;
  incidentDate: string;
  point: number;
  note?: string | null;
  status: string;
  student?: { id: string; name: string; nis: string };
  rule?: DisciplineRuleRecord;
  reportedBy?: { id: string; name: string };
  confirmedBy?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentAchievementRecord = {
  id: string;
  studentId: string;
  title: string;
  category: string;
  point: number;
  awardedAt: string;
  description?: string | null;
  certificateUrl?: string | null;
  student?: { id: string; name: string; nis: string };
  awardedBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

export type DisciplineSummaryRecord = {
  totalViolations: number;
  totalAchievements: number;
  topViolations: Array<{ rule: string; count: number }>;
  topAchievements: Array<{ type: string; count: number }>;
};

export type StudentDisciplinePortalSummary = {
  student?: {
    id: string;
    nis: string;
    nisn?: string | null;
    name: string;
    classroom?: { id: string; code: string; name: string } | null;
  };
  totalViolationPoints: number;
  totalAchievementPoints: number;
  netPoints: number;
  violationCount: number;
  achievementCount: number;
  latestViolations: DisciplineViolationRecord[];
  latestAchievements: StudentAchievementRecord[];
};

export type LetterTemplateRecord = {
  id: string;
  name: string;
  code?: string | null;
  content: string;
  isActive: boolean;
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

export type LetterRecord = {
  id: string;
  letterNumber?: string | null;
  templateId?: string | null;
  subject: string;
  body: string;
  recipientName: string;
  recipientEmail?: string | null;
  recipientAddress?: string | null;
  recipientType?: string;
  status: string;
  category?: string;
  direction?: string;
  priority?: string;
  createdById: string;
  approvedById?: string | null;
  rejectedById?: string | null;
  rejectionReason?: string | null;
  issuedAt?: string | null;
  archivedAt?: string | null;
  template?: LetterTemplateRecord;
  createdBy?: { id: string; name: string };
  approvedBy?: { id: string; name: string } | null;
  attachments?: Array<{ id: string; originalName: string; mimeType: string; size: number }>;
  createdAt: string;
  updatedAt: string;
};

export type LetterSummaryRecord = {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
  issued: number;
  archived: number;
};

export type ExamTypeRecord = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExamRoomRecord = {
  id: string;
  code: string;
  name: string;
  capacity: number;
  location?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExamRecord = {
  id: string;
  examTypeId: string;
  academicYearId: string;
  semesterId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  duration: number;
  totalQuestions?: number | null;
  maxScore?: number | null;
  passingScore?: number | null;
  status: string;
  isCbt: boolean;
  instruction?: string | null;
  notes?: string | null;
  examType?: ExamTypeRecord;
  academicYear?: { id: string; name: string };
  semester?: { id: string; name: string } | null;
  _count?: { schedules: number; participants: number; questions: number };
  schedules?: ExamScheduleRecord[];
  createdAt: string;
  updatedAt: string;
};

export type ExamScheduleRecord = {
  id: string;
  examId: string;
  roomId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  supervisorId?: string | null;
  notes?: string | null;
  room?: ExamRoomRecord | null;
  supervisor?: { id: string; name: string } | null;
  sessions?: ExamSessionRecord[];
  createdAt: string;
  updatedAt: string;
};

export type ExamSessionRecord = {
  id: string;
  scheduleId: string;
  code: string;
  name?: string | null;
  status: string;
  startedAt?: string | null;
  endedAt?: string | null;
  token?: string | null;
  _count?: { participants: number; attendances: number };
  createdAt: string;
  updatedAt: string;
};

export type ExamParticipantRecord = {
  id: string;
  examId: string;
  sessionId?: string | null;
  studentId: string;
  number?: number | null;
  status: string;
  score?: number | null;
  notes?: string | null;
  student?: Pick<StudentRecord, "id" | "nis" | "name"> | null;
  session?: ExamSessionRecord | null;
  createdAt: string;
  updatedAt: string;
};

export type ExamQuestionRecord = {
  id: string;
  examId: string;
  bankId?: string | null;
  number: number;
  type: string;
  content: string;
  options?: unknown;
  correctAnswer?: string | null;
  score: number;
  attachmentUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExamSummaryRecord = {
  totalExams: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
};

export type QuestionBankRecord = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExamBulkParticipantResult = {
  added: number;
  skipped: number;
};

export type ExamResultRecord = {
  id: string;
  examId: string;
  participantId: string;
  questionId: string;
  answer?: string | null;
  isCorrect?: boolean | null;
  score?: number | null;
  gradedAt?: string | null;
  gradedById?: string | null;
  createdAt: string;
  updatedAt: string;
  participant?: ExamParticipantRecord;
  question?: Pick<ExamQuestionRecord, "id" | "number">;
};

export type LibraryCategoryRecord = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LibraryShelfRecord = {
  id: string;
  code: string;
  name: string;
  location?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LibraryBookRecord = {
  id: string;
  categoryId: string;
  shelfId?: string | null;
  isbn?: string | null;
  code: string;
  title: string;
  subtitle?: string | null;
  author: string;
  publisher?: string | null;
  publicationYear?: number | null;
  language?: string | null;
  edition?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  status: string;
  category?: LibraryCategoryRecord;
  shelf?: LibraryShelfRecord | null;
  createdAt: string;
  updatedAt: string;
};

export type LibraryBookCopyRecord = {
  id: string;
  bookId: string;
  copyCode: string;
  barcode?: string | null;
  status: string;
  condition?: string | null;
  book?: Pick<LibraryBookRecord, "id" | "title" | "code" | "author">;
  createdAt: string;
  updatedAt: string;
};

export type LibraryMemberRecord = {
  id: string;
  memberCode: string;
  type: string;
  status: string;
  externalName?: string | null;
  externalContact?: string | null;
  student?: { id: string; name: string } | null;
  teacher?: { id: string; name: string } | null;
  joinedAt: string;
  expiredAt?: string | null;
  maxLoan: number;
  createdAt: string;
  updatedAt: string;
};

export type LibraryLoanRecord = {
  id: string;
  memberId: string;
  copyId: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt?: string | null;
  status: string;
  note?: string | null;
  returnNote?: string | null;
  copy?: { copyCode?: string; book?: { title?: string } };
  member?: {
    memberCode?: string;
    externalName?: string;
    student?: { name?: string };
    teacher?: { name?: string };
  };
  createdAt: string;
  updatedAt: string;
};

export type LibraryReservationRecord = {
  id: string;
  memberId: string;
  bookId: string;
  status: string;
  requestedAt: string;
  readyAt?: string | null;
  expiredAt?: string | null;
  cancelledAt?: string | null;
  note?: string | null;
  member?: LibraryMemberRecord;
  book?: Pick<LibraryBookRecord, "id" | "title" | "code">;
  createdAt: string;
  updatedAt: string;
};

export type LibraryFineRecord = {
  id: string;
  loanId: string;
  memberId: string;
  amount: number | string;
  reason: string;
  status: string;
  paidAt?: string | null;
  waivedAt?: string | null;
  member?: LibraryMemberRecord;
  loan?: LibraryLoanRecord;
  createdAt: string;
  updatedAt: string;
};

export type LibrarySummaryRecord = {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  overdueLoans: number;
  unpaidFines: number | string;
  /** Legacy UI fields — not always returned by API */
  activeLoans?: number;
  totalMembers?: number;
};

export type InventoryCategoryRecord = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InventoryLocationRecord = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  roomId?: string | null;
  responsibleUserId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InventoryItemRecord = {
  id: string;
  categoryId: string;
  locationId?: string | null;
  code: string;
  name: string;
  type: string;
  description?: string | null;
  brand?: string | null;
  model?: string | null;
  unit: string;
  quantity: number;
  minStock?: number | null;
  purchaseDate?: string | null;
  purchasePrice?: number | string | null;
  supplier?: string | null;
  status: string;
  condition: string;
  category?: InventoryCategoryRecord;
  location?: InventoryLocationRecord | null;
  createdAt: string;
  updatedAt: string;
};

export type InventoryMovementRecord = {
  id: string;
  itemId: string;
  type: string;
  quantity: number;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  note?: string | null;
  performedAt: string;
  createdAt: string;
};

export type InventoryMaintenanceRecord = {
  id: string;
  itemId: string;
  title: string;
  description?: string | null;
  status: string;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cost?: number | string | null;
  vendor?: string | null;
  item?: Pick<InventoryItemRecord, "id" | "code" | "name">;
  createdAt: string;
  updatedAt: string;
};

export type InventoryLoanRecord = {
  id: string;
  itemId: string;
  borrowerName: string;
  borrowerType: string;
  quantity: number;
  purpose: string;
  status: string;
  requestedAt: string;
  approvedAt?: string | null;
  borrowedAt?: string | null;
  dueAt?: string | null;
  returnedAt?: string | null;
  note?: string | null;
  item?: Pick<InventoryItemRecord, "id" | "code" | "name">;
  createdAt: string;
  updatedAt: string;
};

export type InventorySummaryRecord = {
  totalItems: number;
  activeAssets: number;
  damagedAssets: number;
  inMaintenance: number;
  borrowedLoans: number;
  lowStockItems: number;
};

export type HRPositionRecord = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeProfileRecord = {
  id: string;
  employeeCode: string;
  fullName: string;
  employmentType: string;
  status: string;
  positionId?: string | null;
  basicSalary?: number | string;
  joinedAt?: string | null;
  position?: HRPositionRecord | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeAttendanceRecord = {
  id: string;
  employeeId: string;
  date: string;
  status: string;
  checkIn?: string | null;
  checkOut?: string | null;
  notes?: string | null;
  employee?: Pick<EmployeeProfileRecord, "id" | "employeeCode" | "fullName">;
  createdAt: string;
  updatedAt: string;
};

export type LeaveRequestRecord = {
  id: string;
  employeeId: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  employee?: Pick<EmployeeProfileRecord, "id" | "employeeCode" | "fullName">;
  createdAt: string;
  updatedAt: string;
};

export type HRSummaryRecord = {
  totalEmployees: number;
  contractEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  inactiveEmployees: number;
};

export type PayrollComponentRecord = {
  id: string;
  code: string;
  name: string;
  type: string;
  calculationType: string;
  defaultAmount?: number | string;
  defaultPercentage?: number | string | null;
  isTaxable: boolean;
  isActive: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeSalaryComponentRecord = {
  id: string;
  employeeId: string;
  componentId: string;
  amount?: number | string | null;
  percentage?: number | string | null;
  isActive: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  component?: PayrollComponentRecord;
  createdAt: string;
  updatedAt: string;
};

export type PayrollPeriodRecord = {
  id: string;
  code: string;
  name: string;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  paymentDate?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PayrollRunRecord = {
  id: string;
  periodId: string;
  employeeId: string;
  status: string;
  grossAmount?: number | string;
  totalEarnings?: number | string;
  totalDeductions?: number | string;
  netAmount?: number | string;
  employee?: Pick<EmployeeProfileRecord, "id" | "employeeCode" | "fullName">;
  period?: Pick<PayrollPeriodRecord, "id" | "code" | "name">;
  createdAt: string;
  updatedAt: string;
};

export type PayslipRecord = {
  id: string;
  payrollRunId: string;
  payslipNumber: string;
  status: string;
  issuedAt?: string | null;
  paidAt?: string | null;
  payrollRun?: PayrollRunRecord;
  createdAt: string;
  updatedAt: string;
};

export type PayrollPaymentRecord = {
  id: string;
  payslipId: string;
  amount: number | string;
  method: string;
  paidAt: string;
  reference?: string | null;
  createdAt: string;
};

export type PayrollSummaryRecord = {
  currentPeriod?: PayrollPeriodRecord | null;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  runsCount: number;
};

export type ActionSuccess = { success: boolean };

// Aggregate summary from dynamic grade queries — shape varies by school
export type GradesClassroomSummary = {
  classroomId: string;
  className: string;
  assessments: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalStudents: number;
};
export type GradesStudentSummary = {
  studentId: string;
  studentName: string;
  nis: string;
  assessments: number;
  averageScore: number;
  totalScore: number;
  maxScore: number;
};

export type ImportResult = {
  totalRows: number;
  successRows: number;
  failedRows: number;
  errors: Array<{ row?: number; field?: string; message: string }>;
};
