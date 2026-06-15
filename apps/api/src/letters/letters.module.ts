import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { LetterNumberService } from "./letter-number.service";
import { LetterPdfService } from "./letter-pdf.service";
import { LettersController } from "./letters.controller";
import { LettersService } from "./letters.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [LettersController],
  providers: [LettersService, LetterNumberService, LetterPdfService],
  exports: [LettersService, LetterNumberService],
})
export class LettersModule {}
