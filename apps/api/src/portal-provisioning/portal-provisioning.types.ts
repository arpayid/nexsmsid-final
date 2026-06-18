import type { Prisma } from "@prisma/client";

import type { RequestMeta } from "../auth/auth.types";

export type PortalProvisionSource = "ppdb-convert" | "manual";

export type ProvisionStudentPortalParams = {
  studentId: string;
  email: string;
  name: string;
  actorId: string;
  meta: RequestMeta;
  source: PortalProvisionSource;
  sendWelcomeEmail?: boolean;
};

export type PortalAccountCredentials = {
  userId: string;
  email: string;
  temporaryPassword: string;
  forceChangePassword: true;
};

export type PrismaTransactionClient = Prisma.TransactionClient;
