import { Controller, Inject } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { MasterDataController } from "../master-data/master-data-controller";
import { RoomsService } from "./rooms.service";

@Controller("rooms")
@ApiTags("Rooms")
@ApiBearerAuth()
export class RoomsController extends MasterDataController {
  constructor(@Inject(RoomsService) service: RoomsService) {
    super("Rooms", service);
  }
}
