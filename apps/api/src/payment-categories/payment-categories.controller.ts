import { Controller, Inject } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { MasterDataController } from "../master-data/master-data-controller";
import { PaymentCategoriesService } from "./payment-categories.service";

@Controller("payment-categories")
@ApiTags("Payment Categories")
@ApiBearerAuth()
export class PaymentCategoriesController extends MasterDataController {
  constructor(@Inject(PaymentCategoriesService) service: PaymentCategoriesService) {
    super("Payment categories", service);
  }
}
