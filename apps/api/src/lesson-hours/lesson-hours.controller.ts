import { Controller, Inject } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { MasterDataController } from "../master-data/master-data-controller";
import { LessonHoursService } from "./lesson-hours.service";

@Controller("lesson-hours")
@ApiTags("Lesson Hours")
@ApiBearerAuth()
export class LessonHoursController extends MasterDataController {
  constructor(@Inject(LessonHoursService) service: LessonHoursService) {
    super("Lesson hours", service);
  }
}
