import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { SemestersController } from "./semesters.controller";
import { SemestersService } from "./semesters.service";

@Module({
  imports: [AuthModule],
  controllers: [SemestersController],
  providers: [SemestersService],
})
export class SemestersModule {}
