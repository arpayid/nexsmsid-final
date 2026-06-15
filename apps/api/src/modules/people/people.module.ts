import { Module } from "@nestjs/common";
import { GuardiansModule } from "../../guardians/guardians.module";
import { StaffsModule } from "../../staffs/staffs.module";
import { StudentsModule } from "../../students/students.module";
import { TeachersModule } from "../../teachers/teachers.module";

@Module({
  imports: [StudentsModule, GuardiansModule, TeachersModule, StaffsModule],
  exports: [StudentsModule, GuardiansModule, TeachersModule, StaffsModule],
})
export class PeopleModule {}
