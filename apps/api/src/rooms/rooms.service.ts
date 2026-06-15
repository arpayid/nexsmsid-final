import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";
import { BaseMasterDataService } from "../master-data/base-master-data.service";
import { createRoomSchema, updateRoomSchema } from "./rooms.dto";

@Injectable()
export class RoomsService extends BaseMasterDataService<typeof createRoomSchema, typeof updateRoomSchema> {
  constructor(@Inject(PrismaService) prisma: PrismaService, @Inject(AuditService) auditService: AuditService) {
    super(prisma, auditService, {
      auditEntity: "room",
      createSchema: createRoomSchema,
      modelName: "room",
      searchableFields: ["code", "name", "type"],
      updateSchema: updateRoomSchema,
    });
  }
}
