export type Overview = {
  people: { studentsActive: number; teachersActive: number; staffsActive: number; guardians: number };
  academic: { classrooms: number; subjects: number; attendanceSessionsThisWeek: number; assessmentsThisSemester: number };
  finance: {
    invoicesIssued: number;
    verifiedPayments: number;
    outstandingInvoices: number;
    outstandingAmount: number;
    expensesThisMonth: number;
  };
  ppdb: { activePeriods: number; activeRegistrations: number };
  programs: { ongoingInternships: number; publishedJobs: number };
  notifications: { unread: number };
};

export type AcademicSummary = {
  attendanceThisWeek: Record<string, number>;
  studentsByGender: Record<string, number>;
  studentsByStatus: Record<string, number>;
};

export type FinanceSummary = {
  invoices: { count: number; paid: number; total: number };
  payments: { count: number; total: number };
  expenses: { count: number; total: number };
  outstanding: { amount: number; count: number };
  monthly: Array<{ expense: number; income: number; month: string }>;
};

export type PpdbSummary = {
  activePeriods: Array<{ endDate: string; id: string; name: string; quota: number | null; startDate: string }>;
  byStatus: Record<string, number>;
  totalRegistrations: number;
};

export type PeopleSummary = {
  guardians: { total: number };
  staffs: { total: number };
  students: { total: number };
  teachers: { total: number };
  usersByRole: Array<{ count: number; role: { id: string; name: string; slug: string } }>;
};

export type ActivityFeedItem = {
  action: string;
  actor: { email: string; id: string; name: string } | null;
  createdAt: string;
  entity: string;
  entityId: string | null;
  id: string;
};

export type QuickAlerts = {
  attendanceMissing: number;
  lowQuotaPeriods: Array<{ name: string; percent: number; quota: number; registrations: number }>;
  overdueInvoices: {
    count: number;
    items: Array<{ id: string; invoiceNumber: string; outstanding: number; student: { name: string; nis: string } }>;
  };
  ppdbActive: { endDate: string; id: string; name: string } | null;
  rejectedPayments: number;
  unreadNotifications: number;
};

export type SystemStatus = {
  api: { status: string; uptime: number; version: string };
  database: { provider: string; status: string };
  redis: { available?: boolean; status: string };
};

export type DashboardData = {
  academic: AcademicSummary;
  activity: ActivityFeedItem[];
  alerts: QuickAlerts;
  finance: FinanceSummary;
  overview: Overview;
  people: PeopleSummary;
  ppdb: PpdbSummary;
  system: SystemStatus;
};
