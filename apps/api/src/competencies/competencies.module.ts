import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { CompetenciesController } from "./competencies.controller";
import { CompetenciesService } from "./competencies.service";

@Module({
  imports: [AuthModule],
  controllers: [CompetenciesController],
  providers: [CompetenciesService],
})
export class CompetenciesModule {}
