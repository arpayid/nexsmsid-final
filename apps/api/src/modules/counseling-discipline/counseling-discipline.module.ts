import { Module } from "@nestjs/common";
import { CounselingModule } from "../../counseling/counseling.module";
import { DisciplineModule } from "../../discipline/discipline.module";

@Module({
  imports: [CounselingModule, DisciplineModule],
  exports: [CounselingModule, DisciplineModule],
})
export class CounselingDisciplineModule {}
