import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TeachingAssignmentsController } from "./teaching-assignments.controller";
import { TeachingAssignmentsService } from "./teaching-assignments.service";

@Module({
  imports: [AuthModule],
  controllers: [TeachingAssignmentsController],
  providers: [TeachingAssignmentsService],
})
export class TeachingAssignmentsModule {}
