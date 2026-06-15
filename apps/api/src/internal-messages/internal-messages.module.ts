import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { InternalMessagesController } from "./internal-messages.controller";
import { InternalMessagesService } from "./internal-messages.service";

@Module({
  imports: [AuthModule, DatabaseModule, AuditModule],
  controllers: [InternalMessagesController],
  providers: [InternalMessagesService],
})
export class InternalMessagesModule {}
