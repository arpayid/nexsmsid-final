import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AuthController } from "./auth.controller";
import { AuthCookieService } from "./auth-cookie.service";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { PermissionGuard } from "./guards/permission.guard";
import { PasswordService } from "./password.service";

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AuthCookieService, JwtAuthGuard, PasswordService, PermissionGuard],
  exports: [AuthService, AuthCookieService, JwtAuthGuard, JwtModule, PasswordService, PermissionGuard],
})
export class AuthModule {}
