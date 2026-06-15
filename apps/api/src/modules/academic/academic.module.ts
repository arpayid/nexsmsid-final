import { Module } from "@nestjs/common";
import { AttendanceModule } from "../../attendance/attendance.module";
import { ClassroomsModule } from "../../classrooms/classrooms.module";
import { GradesModule } from "../../grades/grades.module";
import { LessonHoursModule } from "../../lesson-hours/lesson-hours.module";
import { SchedulesModule } from "../../schedules/schedules.module";
import { SubjectsModule } from "../../subjects/subjects.module";
import { TeachingAssignmentsModule } from "../../teaching-assignments/teaching-assignments.module";

@Module({
  imports: [
    SubjectsModule,
    LessonHoursModule,
    TeachingAssignmentsModule,
    SchedulesModule,
    AttendanceModule,
    GradesModule,
    ClassroomsModule,
  ],
  exports: [
    SubjectsModule,
    LessonHoursModule,
    TeachingAssignmentsModule,
    SchedulesModule,
    AttendanceModule,
    GradesModule,
    ClassroomsModule,
  ],
})
export class AcademicModule {}
