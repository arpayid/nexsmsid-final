import { Injectable, BadRequestException, Inject } from "@nestjs/common";
import { ReportRegistryService } from "./report-registry.service";

@Injectable()
export class ReportFilterValidationService {
  constructor(@Inject(ReportRegistryService) private readonly registry: ReportRegistryService) {}

  validate(reportCode: string, filters: Record<string, any>) {
    const report = this.registry.getByCode(reportCode);
    if (!report) {
      throw new BadRequestException(`Report type ${reportCode} not found`);
    }

    // Check required filters
    for (const required of report.requiredFilters) {
      if (filters[required] === undefined || filters[required] === null || filters[required] === "") {
        throw new BadRequestException(`Filter ${required} is required for report ${report.name}`);
      }
    }

    // Validate date ranges if both exist
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      if (start > end) {
        throw new BadRequestException("Start date cannot be after end date");
      }
    }

    return true;
  }
}
