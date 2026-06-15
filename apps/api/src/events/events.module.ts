import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { DatabaseModule } from "../database/database.module";
import { EventsGateway } from "./events.gateway";

@Global()
@Module({
  imports: [JwtModule.register({}), DatabaseModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
