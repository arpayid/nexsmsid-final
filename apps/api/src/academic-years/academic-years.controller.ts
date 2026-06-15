import { Controller, Inject } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { MasterDataController } from "../master-data/master-data-controller";
import { AcademicYearsService } from "./academic-years.service";

@Controller("academic-years")
@ApiTags("Academic Years")
@ApiBearerAuth()
export class AcademicYearsController extends MasterDataController {
  constructor(@Inject(AcademicYearsService) service: AcademicYearsService) {
    super("Academic years", service);
  }
}
