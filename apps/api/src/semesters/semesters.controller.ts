import { Controller, Inject } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { MasterDataController } from "../master-data/master-data-controller";
import { SemestersService } from "./semesters.service";

@Controller("semesters")
@ApiTags("Semesters")
@ApiBearerAuth()
export class SemestersController extends MasterDataController {
  constructor(@Inject(SemestersService) service: SemestersService) {
    super("Semesters", service);
  }
}
