import { Module } from "@nestjs/common";
import { AuditModule } from "../../audit/audit.module";
import { AuthModule } from "../../auth/auth.module";
import { PermissionsModule } from "../../permissions/permissions.module";
import { RolesModule } from "../../roles/roles.module";
import { UsersModule } from "../../users/users.module";
import { SessionsModule } from "./sessions/sessions.module";

@Module({
  imports: [AuthModule, UsersModule, RolesModule, PermissionsModule, AuditModule, SessionsModule],
  exports: [AuthModule, UsersModule, RolesModule, PermissionsModule, AuditModule, SessionsModule],
})
export class IdentityModule {}
