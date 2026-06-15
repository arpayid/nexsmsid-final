import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { PublicPpdbController } from "./public-ppdb.controller";
import { PublicPpdbService } from "./public-ppdb.service";
import { PublicController } from "./public.controller";
import { PublicSiteService } from "./public-site.service";
import { PpdbUploadTokenService } from "./ppdb-upload-token.service";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [PublicPpdbController, PublicController],
  providers: [PublicPpdbService, PublicSiteService, PpdbUploadTokenService],
})
export class PublicPpdbModule {}
