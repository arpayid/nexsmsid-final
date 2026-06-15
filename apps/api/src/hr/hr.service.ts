import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  CreateHRPositionDto,
  UpdateHRPositionDto,
  CreateEmployeeProfileDto,
  UpdateEmployeeProfileDto,
  CreateEmployeeAttendanceDto,
  UpdateEmployeeAttendanceDto,
  CreateLeaveRequestDto,
  UpdateLeaveRequestDto,
  RejectLeaveRequestDto,
} from "./hr.dto";
import { LeaveRequestStatus } from "@prisma/client";

@Injectable()
export class HRService {
  private readonly logger = new Logger(HRService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  // =========================================================================
  // POSITIONS
  // =========================================================================

  async getPositions(params: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    const { page = 1, limit = 10, search, isActive } = params;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }];
    }
    if (isActive !== undefined) where.isActive = String(isActive) === "true";

    const [total, data] = await Promise.all([
      this.prisma.hRPosition.count({ where }),
      this.prisma.hRPosition.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { name: "asc" },
      }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getPosition(id: string) {
    const position = await this.prisma.hRPosition.findFirst({ where: { id, deletedAt: null } });
    if (!position) throw new NotFoundException("Position not found");
    return position;
  }

  async createPosition(data: CreateHRPositionDto, userId: string) {
    const existing = await this.prisma.hRPosition.findFirst({ where: { code: data.code, deletedAt: null } });
    if (existing) throw new BadRequestException("Position code already exists");

    const created = await this.prisma.hRPosition.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });

    await this.audit.record({
      actorId: userId,
      action: "hr.position.create",
      entity: "Created HR position",
      metadata: { positionId: created.id },
    });
    return created;
  }

  async updatePosition(id: string, data: UpdateHRPositionDto, userId: string) {
    await this.getPosition(id);
    const updated = await this.prisma.hRPosition.update({
      where: { id },
      data,
    });
    await this.audit.record({ actorId: userId, action: "hr.position.update", entity: "Updated HR position", metadata: { positionId: id } });
    return updated;
  }

  async deletePosition(id: string, userId: string) {
    await this.getPosition(id);
    const count = await this.prisma.employeeProfile.count({ where: { positionId: id, deletedAt: null } });
    if (count > 0) throw new BadRequestException("Cannot delete position with active employees");

    await this.prisma.hRPosition.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({ actorId: userId, action: "hr.position.delete", entity: "Deleted HR position", metadata: { positionId: id } });
    return { success: true };
  }

  // =========================================================================
  // EMPLOYEES
  // =========================================================================

  async getEmployees(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    employmentType?: string;
    positionId?: string;
  }) {
    const { page = 1, limit = 10, search, status, employmentType, positionId } = params;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [{ fullName: { contains: search, mode: "insensitive" } }, { employeeCode: { contains: search, mode: "insensitive" } }];
    }
    if (status) where.status = status;
    if (employmentType) where.employmentType = employmentType;
    if (positionId) where.positionId = positionId;

    const [total, data] = await Promise.all([
      this.prisma.employeeProfile.count({ where }),
      this.prisma.employeeProfile.findMany({
        where,
        include: { position: true, user: { select: { id: true, email: true, name: true } } },
        skip,
        take: Number(limit),
        orderBy: { fullName: "asc" },
      }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getEmployee(id: string) {
    const employee = await this.prisma.employeeProfile.findFirst({
      where: { id, deletedAt: null },
      include: {
        position: true,
        user: { select: { id: true, email: true, name: true } },
        salaryComponents: { include: { component: true }, where: { deletedAt: null } },
      },
    });
    if (!employee) throw new NotFoundException("Employee not found");
    return employee;
  }

  async createEmployee(data: CreateEmployeeProfileDto, userId: string) {
    const existing = await this.prisma.employeeProfile.findFirst({ where: { employeeCode: data.employeeCode, deletedAt: null } });
    if (existing) throw new BadRequestException("Employee code already exists");

    if (!data.fullName) throw new BadRequestException("Full name is required");
    if (!data.userId && !data.teacherId && !data.staffId && !data.fullName) {
      throw new BadRequestException("At least one identity is required");
    }

    const created = await this.prisma.employeeProfile.create({
      data: {
        employeeCode: data.employeeCode,
        userId: data.userId,
        teacherId: data.teacherId,
        staffId: data.staffId,
        positionId: data.positionId,
        fullName: data.fullName,
        employmentType: data.employmentType,
        status: data.status,
        joinedAt: data.joinedAt ? new Date(data.joinedAt) : null,
        endedAt: data.endedAt ? new Date(data.endedAt) : null,
        bankName: data.bankName,
        bankAccountNumber: data.bankAccountNumber,
        bankAccountName: data.bankAccountName,
        taxNumber: data.taxNumber,
        basicSalary: data.basicSalary,
        notes: data.notes,
        createdById: userId,
      },
    });

    await this.audit.record({
      actorId: userId,
      action: "hr.employee.create",
      entity: "Created employee profile",
      metadata: { employeeId: created.id },
    });
    return created;
  }

  async updateEmployee(id: string, data: UpdateEmployeeProfileDto, userId: string) {
    await this.getEmployee(id);
    const updated = await this.prisma.employeeProfile.update({
      where: { id },
      data: {
        ...data,
        joinedAt: data.joinedAt ? new Date(data.joinedAt) : undefined,
        endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
        updatedById: userId,
      },
    });
    await this.audit.record({
      actorId: userId,
      action: "hr.employee.update",
      entity: "Updated employee profile",
      metadata: { employeeId: id },
    });
    return updated;
  }

  async deleteEmployee(id: string, userId: string) {
    await this.getEmployee(id);
    const runs = await this.prisma.payrollRun.count({ where: { employeeId: id, deletedAt: null } });
    if (runs > 0) throw new BadRequestException("Cannot delete employee with payroll records");

    await this.prisma.employeeProfile.update({ where: { id }, data: { deletedAt: new Date(), updatedById: userId } });
    await this.audit.record({
      actorId: userId,
      action: "hr.employee.delete",
      entity: "Deleted employee profile",
      metadata: { employeeId: id },
    });
    return { success: true };
  }

  // =========================================================================
  // ATTENDANCE
  // =========================================================================

  async getAttendance(params: { page?: number; limit?: number; employeeId?: string; startDate?: string; endDate?: string }) {
    const { page = 1, limit = 10, employeeId, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (employeeId) where.employeeId = employeeId;
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const [total, data] = await Promise.all([
      this.prisma.employeeAttendance.count({ where }),
      this.prisma.employeeAttendance.findMany({
        where,
        include: { employee: { select: { fullName: true, employeeCode: true } } },
        skip,
        take: Number(limit),
        orderBy: { date: "desc" },
      }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async createAttendance(data: CreateEmployeeAttendanceDto, userId: string) {
    const date = new Date(data.date);

    // Check for any existing row with same employeeId + date, including soft-deleted
    const existing = await this.prisma.employeeAttendance.findFirst({
      where: { employeeId: data.employeeId, date },
    });

    if (existing) {
      if (existing.deletedAt === null) {
        throw new BadRequestException("Attendance already recorded for this date");
      }
      // Restore soft-deleted row
      const restored = await this.prisma.employeeAttendance.update({
        where: { id: existing.id },
        data: {
          deletedAt: null,
          status: data.status,
          checkInAt: data.checkInAt ? new Date(data.checkInAt) : null,
          checkOutAt: data.checkOutAt ? new Date(data.checkOutAt) : null,
          lateMinutes: data.lateMinutes,
          workMinutes: data.workMinutes,
          note: data.note,
          recordedById: userId,
        },
      });
      await this.audit.record({
        actorId: userId,
        action: "hr.attendance.create",
        entity: "Restored employee attendance",
        metadata: { attendanceId: restored.id },
      });
      return restored;
    }

    const created = await this.prisma.employeeAttendance.create({
      data: {
        employeeId: data.employeeId,
        date,
        status: data.status,
        checkInAt: data.checkInAt ? new Date(data.checkInAt) : null,
        checkOutAt: data.checkOutAt ? new Date(data.checkOutAt) : null,
        lateMinutes: data.lateMinutes,
        workMinutes: data.workMinutes,
        note: data.note,
        recordedById: userId,
      },
    });

    await this.audit.record({
      actorId: userId,
      action: "hr.attendance.create",
      entity: "Created employee attendance",
      metadata: { attendanceId: created.id },
    });
    return created;
  }

  async updateAttendance(id: string, data: UpdateEmployeeAttendanceDto, userId: string) {
    const existing = await this.prisma.employeeAttendance.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Attendance not found");

    const updated = await this.prisma.employeeAttendance.update({
      where: { id },
      data: {
        ...data,
        checkInAt: data.checkInAt ? new Date(data.checkInAt) : undefined,
        checkOutAt: data.checkOutAt ? new Date(data.checkOutAt) : undefined,
      },
    });

    await this.audit.record({
      actorId: userId,
      action: "hr.attendance.update",
      entity: "Updated employee attendance",
      metadata: { attendanceId: id },
    });
    return updated;
  }

  async deleteAttendance(id: string, userId: string) {
    const existing = await this.prisma.employeeAttendance.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Attendance not found");

    await this.prisma.employeeAttendance.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      actorId: userId,
      action: "hr.attendance.delete",
      entity: "Deleted employee attendance",
      metadata: { attendanceId: id },
    });
    return { success: true };
  }

  // =========================================================================
  // LEAVE REQUESTS
  // =========================================================================

  async getLeaveRequests(params: { page?: number; limit?: number; employeeId?: string; status?: string }) {
    const { page = 1, limit = 10, employeeId, status } = params;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const [total, data] = await Promise.all([
      this.prisma.leaveRequest.count({ where }),
      this.prisma.leaveRequest.findMany({
        where,
        include: { employee: { select: { fullName: true, employeeCode: true } } },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getLeaveRequest(id: string) {
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id, deletedAt: null },
      include: { employee: true, approvedBy: { select: { name: true } }, rejectedBy: { select: { name: true } } },
    });
    if (!leave) throw new NotFoundException("Leave request not found");
    return leave;
  }

  async createLeaveRequest(data: CreateLeaveRequestDto, userId: string) {
    const sDate = new Date(data.startDate);
    const eDate = new Date(data.endDate);
    if (sDate > eDate) throw new BadRequestException("Start date must be before end date");
    const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const created = await this.prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        type: data.type,
        startDate: sDate,
        endDate: eDate,
        totalDays,
        reason: data.reason,
        createdById: userId,
      },
    });

    await this.audit.record({
      actorId: userId,
      action: "hr.leave.create",
      entity: "Created leave request",
      metadata: { leaveId: created.id },
    });

    // Notify approver/hr-payroll (in a real system we might find the exact user, here we can skip or log)
    // Optional if no specific recipient available

    return created;
  }

  async updateLeaveRequest(id: string, data: UpdateLeaveRequestDto, userId: string) {
    const leave = await this.getLeaveRequest(id);
    if (leave.status !== "PENDING") throw new BadRequestException("Only PENDING leave requests can be updated");

    const updateData: any = { ...data };
    if (data.startDate || data.endDate) {
      const sDate = new Date(data.startDate || leave.startDate);
      const eDate = new Date(data.endDate || leave.endDate);
      if (sDate > eDate) throw new BadRequestException("Start date must be before end date");
      const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
      updateData.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      updateData.startDate = sDate;
      updateData.endDate = eDate;
    }

    const updated = await this.prisma.leaveRequest.update({ where: { id }, data: updateData });
    await this.audit.record({ actorId: userId, action: "hr.leave.update", entity: "Updated leave request", metadata: { leaveId: id } });
    return updated;
  }

  async approveLeaveRequest(id: string, userId: string) {
    const leave = await this.getLeaveRequest(id);
    if (leave.status !== "PENDING") throw new BadRequestException("Only PENDING leave requests can be approved");

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: "APPROVED", approvedById: userId, approvedAt: new Date() },
      include: { employee: true },
    });

    await this.audit.record({ actorId: userId, action: "hr.leave.approve", entity: "Approved leave request", metadata: { leaveId: id } });

    if (updated.employee?.userId) {
      this.notifications
        .createSystemNotification({
          userId: updated.employee.userId,
          title: "Leave Request Approved",
          body: `Your leave request for ${updated.startDate.toDateString()} has been approved.`,
          channel: "IN_APP",
        })
        .catch((error) => {
          this.logger.warn(
            `Failed to send leave approval notification for user ${updated.employee?.userId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
    }

    return updated;
  }

  async rejectLeaveRequest(id: string, data: RejectLeaveRequestDto, userId: string) {
    const leave = await this.getLeaveRequest(id);
    if (leave.status !== "PENDING") throw new BadRequestException("Only PENDING leave requests can be rejected");

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: "REJECTED", rejectedById: userId, rejectedAt: new Date(), rejectionReason: data.rejectionReason },
      include: { employee: true },
    });

    await this.audit.record({ actorId: userId, action: "hr.leave.reject", entity: "Rejected leave request", metadata: { leaveId: id } });

    if (updated.employee?.userId) {
      this.notifications
        .createSystemNotification({
          userId: updated.employee.userId,
          title: "Leave Request Rejected",
          body: `Your leave request for ${updated.startDate.toDateString()} has been rejected.`,
          channel: "IN_APP",
        })
        .catch((error) => {
          this.logger.warn(
            `Failed to send leave rejection notification for user ${updated.employee?.userId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
    }

    return updated;
  }

  async cancelLeaveRequest(id: string, userId: string) {
    const leave = await this.getLeaveRequest(id);
    if (leave.status === "REJECTED" || leave.status === "CANCELLED")
      throw new BadRequestException("Leave request already rejected/cancelled");
    if (leave.startDate < new Date()) throw new BadRequestException("Cannot cancel leave request that has already started");

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await this.audit.record({ actorId: userId, action: "hr.leave.cancel", entity: "Cancelled leave request", metadata: { leaveId: id } });
    return updated;
  }

  async deleteLeaveRequest(id: string, userId: string) {
    const leave = await this.getLeaveRequest(id);
    await this.prisma.leaveRequest.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({ actorId: userId, action: "hr.leave.delete", entity: "Deleted leave request", metadata: { leaveId: id } });
    return { success: true };
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================

  async getSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalEmployees, contractEmployees, presentToday, pendingLeaves, inactiveEmployees] = await Promise.all([
      this.prisma.employeeProfile.count({ where: { deletedAt: null } }),
      this.prisma.employeeProfile.count({ where: { employmentType: "CONTRACT", deletedAt: null } }),
      this.prisma.employeeAttendance.count({ where: { date: { gte: today }, status: "PRESENT", deletedAt: null } }),
      this.prisma.leaveRequest.count({ where: { status: "PENDING", deletedAt: null } }),
      this.prisma.employeeProfile.count({ where: { status: { in: ["INACTIVE", "TERMINATED", "RETIRED"] }, deletedAt: null } }),
    ]);

    return {
      totalEmployees,
      contractEmployees,
      presentToday,
      pendingLeaves,
      inactiveEmployees,
    };
  }
}
