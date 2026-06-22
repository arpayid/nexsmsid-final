import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import {
  CreateInventoryCategoryDto,
  UpdateInventoryCategoryDto,
  CreateInventoryLocationDto,
  UpdateInventoryLocationDto,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  CreateInventoryMovementDto,
  CreateInventoryMaintenanceDto,
  UpdateInventoryMaintenanceDto,
  InventoryQueryDto,
} from "./inventory.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class InventoryItemsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // Categories
  async getCategories() {
    return this.prisma.inventoryCategory.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
  }

  async getCategory(id: string) {
    const cat = await this.prisma.inventoryCategory.findUnique({ where: { id, deletedAt: null } });
    if (!cat) throw new NotFoundException("Category not found");
    return cat;
  }

  async createCategory(dto: CreateInventoryCategoryDto, actorId: string) {
    const exists = await this.prisma.inventoryCategory.findUnique({ where: { code: dto.code } });
    if (exists) throw new BadRequestException("Category code already exists");
    const category = await this.prisma.inventoryCategory.create({ data: dto });
    await this.audit.record({
      actorId,
      action: "inventory.category.create",
      entity: "InventoryCategory",
      entityId: category.id,
      metadata: { code: category.code },
    });
    return category;
  }

  async updateCategory(id: string, dto: UpdateInventoryCategoryDto, actorId: string) {
    const cat = await this.getCategory(id);
    if (dto.code && dto.code !== cat.code) {
      const exists = await this.prisma.inventoryCategory.findUnique({ where: { code: dto.code } });
      if (exists) throw new BadRequestException("Category code already exists");
    }
    const updated = await this.prisma.inventoryCategory.update({ where: { id }, data: dto });
    await this.audit.record({
      actorId,
      action: "inventory.category.update",
      entity: "InventoryCategory",
      entityId: updated.id,
      metadata: { code: updated.code },
    });
    return updated;
  }

  async deleteCategory(id: string, actorId: string) {
    const items = await this.prisma.inventoryItem.count({ where: { categoryId: id, deletedAt: null } });
    if (items > 0) throw new BadRequestException("Cannot delete category with active items");
    await this.prisma.inventoryCategory.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({ actorId, action: "inventory.category.delete", entity: "InventoryCategory", entityId: id, metadata: {} });
    return { success: true };
  }

  // Locations
  async getLocations() {
    return this.prisma.inventoryLocation.findMany({
      where: { deletedAt: null },
      include: { room: true, responsibleUser: true },
      orderBy: { name: "asc" },
    });
  }

  async getLocation(id: string) {
    const loc = await this.prisma.inventoryLocation.findUnique({
      where: { id, deletedAt: null },
      include: { room: true, responsibleUser: true },
    });
    if (!loc) throw new NotFoundException("Location not found");
    return loc;
  }

  async createLocation(dto: CreateInventoryLocationDto, actorId: string) {
    const exists = await this.prisma.inventoryLocation.findUnique({ where: { code: dto.code } });
    if (exists) throw new BadRequestException("Location code already exists");
    const location = await this.prisma.inventoryLocation.create({ data: dto });
    await this.audit.record({
      actorId,
      action: "inventory.location.create",
      entity: "InventoryLocation",
      entityId: location.id,
      metadata: { code: location.code },
    });
    return location;
  }

  async updateLocation(id: string, dto: UpdateInventoryLocationDto, actorId: string) {
    const loc = await this.getLocation(id);
    if (dto.code && dto.code !== loc.code) {
      const exists = await this.prisma.inventoryLocation.findUnique({ where: { code: dto.code } });
      if (exists) throw new BadRequestException("Location code already exists");
    }
    const updated = await this.prisma.inventoryLocation.update({ where: { id }, data: dto });
    await this.audit.record({
      actorId,
      action: "inventory.location.update",
      entity: "InventoryLocation",
      entityId: updated.id,
      metadata: { code: updated.code },
    });
    return updated;
  }

  async deleteLocation(id: string, actorId: string) {
    const items = await this.prisma.inventoryItem.count({ where: { locationId: id, deletedAt: null } });
    if (items > 0) throw new BadRequestException("Cannot delete location with active items");
    await this.prisma.inventoryLocation.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({ actorId, action: "inventory.location.delete", entity: "InventoryLocation", entityId: id, metadata: {} });
    return { success: true };
  }

  // Items
  async getItems(query: InventoryQueryDto) {
    const where: Prisma.InventoryItemWhereInput = { deletedAt: null };
    if (query.search) {
      where.OR = [{ name: { contains: query.search, mode: "insensitive" } }, { code: { contains: query.search, mode: "insensitive" } }];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.locationId) where.locationId = query.locationId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.condition) where.condition = query.condition;
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      this.prisma.inventoryItem.count({ where }),
      this.prisma.inventoryItem.findMany({
        where,
        include: { category: true, location: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return { total, page, limit, data };
  }

  async getItem(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id, deletedAt: null },
      include: { category: true, location: true },
    });
    if (!item) throw new NotFoundException("Item not found");
    return item;
  }

  async createItem(dto: CreateInventoryItemDto, actorId: string) {
    const exists = await this.prisma.inventoryItem.findUnique({ where: { code: dto.code } });
    if (exists) throw new BadRequestException("Item code already exists");
    if (dto.quantity !== undefined && dto.quantity < 0) throw new BadRequestException("Quantity cannot be negative");
    const { purchaseDate, ...rest } = dto;
    const item = await this.prisma.inventoryItem.create({
      data: { ...rest, purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined, createdById: actorId },
    });
    await this.audit.record({
      actorId,
      action: "inventory.item.create",
      entity: "InventoryItem",
      entityId: item.id,
      metadata: { code: item.code, categoryId: item.categoryId },
    });
    return item;
  }

  async updateItem(id: string, dto: UpdateInventoryItemDto, actorId: string) {
    const item = await this.getItem(id);
    if (dto.code && dto.code !== item.code) {
      const exists = await this.prisma.inventoryItem.findUnique({ where: { code: dto.code } });
      if (exists) throw new BadRequestException("Item code already exists");
    }
    const { purchaseDate, ...rest } = dto;
    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: { ...rest, purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined, updatedById: actorId },
    });
    await this.audit.record({
      actorId,
      action: "inventory.item.update",
      entity: "InventoryItem",
      entityId: updated.id,
      metadata: { code: updated.code },
    });
    return updated;
  }

  async deleteItem(id: string, actorId: string) {
    const loans = await this.prisma.inventoryLoan.count({ where: { itemId: id, status: "BORROWED" } });
    if (loans > 0) throw new BadRequestException("Cannot delete item with active borrowed loans");
    await this.prisma.inventoryItem.update({ where: { id }, data: { deletedAt: new Date(), updatedById: actorId } });
    await this.audit.record({ actorId, action: "inventory.item.delete", entity: "InventoryItem", entityId: id, metadata: {} });
    return { success: true };
  }

  // Movements
  async getMovements(query: InventoryQueryDto) {
    const where: Prisma.InventoryMovementWhereInput = {};
    if (query.startDate && query.endDate) {
      where.performedAt = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
    }
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      this.prisma.inventoryMovement.count({ where }),
      this.prisma.inventoryMovement.findMany({
        where,
        include: { item: true, fromLocation: true, toLocation: true, performedBy: true },
        skip,
        take: limit,
        orderBy: { performedAt: "desc" },
      }),
    ]);
    return { total, page, limit, data };
  }

  async getItemMovements(itemId: string) {
    return this.prisma.inventoryMovement.findMany({
      where: { itemId },
      include: { fromLocation: true, toLocation: true, performedBy: true },
      orderBy: { performedAt: "desc" },
    });
  }

  async createMovement(dto: CreateInventoryMovementDto, actorId: string) {
    if (dto.quantity <= 0) throw new BadRequestException("Movement quantity must be > 0");
    const item = await this.getItem(dto.itemId);
    if ((dto.type === "OUT" || dto.type === "BORROW" || dto.type === "DISPOSAL") && item.quantity < dto.quantity) {
      throw new BadRequestException("Insufficient quantity for OUT/BORROW/DISPOSAL movement");
    }
    if (dto.type === "TRANSFER" && !dto.toLocationId) throw new BadRequestException("TRANSFER must specify toLocationId");
    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.inventoryMovement.create({ data: { ...dto, performedById: actorId } });
      const updateData: Prisma.InventoryItemUncheckedUpdateInput = {};
      if (dto.type === "IN" || dto.type === "RETURN") updateData.quantity = { increment: dto.quantity };
      else if (dto.type === "OUT" || dto.type === "BORROW" || dto.type === "DISPOSAL") updateData.quantity = { decrement: dto.quantity };
      if (dto.type === "TRANSFER") updateData.locationId = dto.toLocationId;
      if (dto.type === "DISPOSAL") updateData.status = "DISPOSED";
      await tx.inventoryItem.update({ where: { id: item.id }, data: updateData });
      await this.audit.record({
        actorId,
        action: dto.type === "TRANSFER" ? "inventory.transfer" : "inventory.movement.create",
        entity: "InventoryItem",
        entityId: item.id,
        metadata: { movementType: dto.type, quantity: dto.quantity },
      });
      return movement;
    });
  }

  // Maintenance
  async getMaintenances(query: InventoryQueryDto) {
    const where: Prisma.InventoryMaintenanceWhereInput = { deletedAt: null };
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      this.prisma.inventoryMaintenance.count({ where }),
      this.prisma.inventoryMaintenance.findMany({
        where,
        include: { item: true, handledBy: true },
        skip,
        take: limit,
        orderBy: { scheduledAt: "asc" },
      }),
    ]);
    return { total, page, limit, data };
  }

  async getMaintenance(id: string) {
    const m = await this.prisma.inventoryMaintenance.findUnique({
      where: { id, deletedAt: null },
      include: { item: true, handledBy: true },
    });
    if (!m) throw new NotFoundException("Maintenance not found");
    return m;
  }

  async createMaintenance(dto: CreateInventoryMaintenanceDto, actorId: string) {
    const { scheduledAt, ...rest } = dto;
    const m = await this.prisma.inventoryMaintenance.create({
      data: { ...rest, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined, createdById: actorId },
    });
    await this.audit.record({
      actorId,
      action: "inventory.maintenance.create",
      entity: "InventoryMaintenance",
      entityId: m.id,
      metadata: { itemId: m.itemId },
    });
    return m;
  }

  async updateMaintenance(id: string, dto: UpdateInventoryMaintenanceDto, actorId: string) {
    const { scheduledAt, ...rest } = dto;
    const m = await this.prisma.inventoryMaintenance.update({
      where: { id },
      data: { ...rest, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined },
    });
    await this.audit.record({
      actorId,
      action: "inventory.maintenance.update",
      entity: "InventoryMaintenance",
      entityId: m.id,
      metadata: {},
    });
    return m;
  }

  async startMaintenance(id: string, actorId: string) {
    const m = await this.getMaintenance(id);
    if (m.status !== "SCHEDULED") throw new BadRequestException("Maintenance must be SCHEDULED to start");
    const updated = await this.prisma.inventoryMaintenance.update({
      where: { id },
      data: { status: "IN_PROGRESS", startedAt: new Date(), handledById: actorId },
    });
    await this.prisma.inventoryItem.update({ where: { id: m.itemId }, data: { status: "MAINTENANCE" } });
    await this.audit.record({ actorId, action: "inventory.maintenance.start", entity: "InventoryMaintenance", entityId: id, metadata: {} });
    return updated;
  }

  async completeMaintenance(id: string, actorId: string) {
    const m = await this.getMaintenance(id);
    if (m.status !== "SCHEDULED" && m.status !== "IN_PROGRESS")
      throw new BadRequestException("Maintenance must be SCHEDULED or IN_PROGRESS to complete");
    const updated = await this.prisma.inventoryMaintenance.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date(), handledById: actorId },
    });
    await this.prisma.inventoryItem.update({ where: { id: m.itemId }, data: { status: "ACTIVE" } });
    await this.audit.record({
      actorId,
      action: "inventory.maintenance.complete",
      entity: "InventoryMaintenance",
      entityId: id,
      metadata: {},
    });
    return updated;
  }

  async cancelMaintenance(id: string, actorId: string) {
    const m = await this.getMaintenance(id);
    const updated = await this.prisma.inventoryMaintenance.update({ where: { id }, data: { status: "CANCELLED", handledById: actorId } });
    if (m.status === "IN_PROGRESS") await this.prisma.inventoryItem.update({ where: { id: m.itemId }, data: { status: "ACTIVE" } });
    await this.audit.record({
      actorId,
      action: "inventory.maintenance.cancel",
      entity: "InventoryMaintenance",
      entityId: id,
      metadata: {},
    });
    return updated;
  }

  async deleteMaintenance(id: string, actorId: string) {
    await this.prisma.inventoryMaintenance.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }
}
