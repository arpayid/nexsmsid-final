import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { StaffsController } from "./staffs.controller";
import { StaffsService } from "./staffs.service";

@Module({
  imports: [AuthModule],
  controllers: [StaffsController],
  providers: [StaffsService],
})
export class StaffsModule {}
