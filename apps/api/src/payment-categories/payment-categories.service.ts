import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";
import { BaseMasterDataService } from "../master-data/base-master-data.service";
import { createPaymentCategorySchema, updatePaymentCategorySchema } from "./payment-categories.dto";

@Injectable()
export class PaymentCategoriesService extends BaseMasterDataService<
  typeof createPaymentCategorySchema,
  typeof updatePaymentCategorySchema
> {
  constructor(@Inject(PrismaService) prisma: PrismaService, @Inject(AuditService) auditService: AuditService) {
    super(prisma, auditService, {
      auditEntity: "payment_category",
      createSchema: createPaymentCategorySchema,
      modelName: "paymentCategory",
      searchableFields: ["code", "name", "description"],
      updateSchema: updatePaymentCategorySchema,
    });
  }
}
