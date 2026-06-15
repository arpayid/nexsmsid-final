import { ForbiddenException } from "@nestjs/common";

import { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";

/**
 * Object-level authorization for academic write operations.
 *
 * A regular teacher may only mutate records (attendance, grades, ...) that belong to a
 * teaching assignment they own. Supervisory/admin roles that hold the broader
 * `overridePermission` (e.g. `attendance.approve`, `grades.approve`) may act across classes.
 *
 * Throws ForbiddenException when the actor is neither the assigned teacher nor an authorized supervisor.
 */
export async function assertCanManageTeachingAssignment(
  prisma: PrismaService,
  actor: AuthenticatedUser,
  assignmentTeacherId: string | null | undefined,
  overridePermission: string,
): Promise<void> {
  if (actor.permissions.includes(overridePermission) || actor.permissions.includes("*")) {
    return;
  }

  if (assignmentTeacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { userId: actor.id },
      select: { id: true },
    });
    if (teacher && teacher.id === assignmentTeacherId) {
      return;
    }
  }

  throw new ForbiddenException("You can only manage records for your own teaching assignments");
}
