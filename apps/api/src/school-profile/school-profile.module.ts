import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { SchoolProfileController } from "./school-profile.controller";
import { SchoolProfileService } from "./school-profile.service";

@Module({
  imports: [AuthModule],
  controllers: [SchoolProfileController],
  providers: [SchoolProfileService],
})
export class SchoolProfileModule {}
