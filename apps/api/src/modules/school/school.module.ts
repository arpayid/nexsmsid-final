import { Module } from "@nestjs/common";
import { AcademicYearsModule } from "../../academic-years/academic-years.module";
import { CompetenciesModule } from "../../competencies/competencies.module";
import { DepartmentsModule } from "../../departments/departments.module";
import { RoomsModule } from "../../rooms/rooms.module";
import { SchoolProfileModule } from "../../school-profile/school-profile.module";
import { SemestersModule } from "../../semesters/semesters.module";

@Module({
  imports: [SchoolProfileModule, AcademicYearsModule, SemestersModule, DepartmentsModule, CompetenciesModule, RoomsModule],
  exports: [SchoolProfileModule, AcademicYearsModule, SemestersModule, DepartmentsModule, CompetenciesModule, RoomsModule],
})
export class SchoolModule {}
