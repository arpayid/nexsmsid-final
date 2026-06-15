import { Controller, Inject } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { MasterDataController } from "../master-data/master-data-controller";
import { DepartmentsService } from "./departments.service";

@Controller("departments")
@ApiTags("Departments")
@ApiBearerAuth()
export class DepartmentsController extends MasterDataController {
  constructor(@Inject(DepartmentsService) service: DepartmentsService) {
    super("Departments", service);
  }
}
