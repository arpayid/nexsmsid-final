import { Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class LibraryReportService {
  private readonly logger = new Logger(LibraryReportService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // Implement basic report generation later
}
