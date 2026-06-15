import { Controller, Inject } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { MasterDataController } from "../master-data/master-data-controller";
import { CompetenciesService } from "./competencies.service";

@Controller("competencies")
@ApiTags("Competencies")
@ApiBearerAuth()
export class CompetenciesController extends MasterDataController {
  constructor(@Inject(CompetenciesService) service: CompetenciesService) {
    super("Competencies", service);
  }
}
