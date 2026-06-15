import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { PaymentCategoriesController } from "./payment-categories.controller";
import { PaymentCategoriesService } from "./payment-categories.service";

@Module({
  imports: [AuthModule],
  controllers: [PaymentCategoriesController],
  providers: [PaymentCategoriesService],
})
export class PaymentCategoriesModule {}
