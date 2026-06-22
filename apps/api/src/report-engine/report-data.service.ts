import { Injectable } from "@nestjs/common";
import { ReportDataResult } from "./report-engine.types";
import { ReportProvider, ReportFilters } from "./report-provider.interface";
import { AcademicReportProvider } from "./providers/academic.report-provider";
import { FinanceReportProvider } from "./providers/finance.report-provider";
import { HrPayrollReportProvider } from "./providers/hr-payroll.report-provider";
import { InventoryLibraryReportProvider } from "./providers/inventory-library.report-provider";
import { CommunicationReportProvider } from "./providers/communication.report-provider";

@Injectable()
export class ReportDataService {
  private readonly providerMap: Map<string, ReportProvider>;

  constructor(
    private readonly academicProvider: AcademicReportProvider,
    private readonly financeProvider: FinanceReportProvider,
    private readonly hrPayrollProvider: HrPayrollReportProvider,
    private readonly inventoryLibraryProvider: InventoryLibraryReportProvider,
    private readonly communicationProvider: CommunicationReportProvider,
  ) {
    this.providerMap = new Map();
    for (const p of [academicProvider, financeProvider, hrPayrollProvider, inventoryLibraryProvider, communicationProvider]) {
      for (const code of p.supportedReports()) {
        this.providerMap.set(code, p);
      }
    }
  }

  async getData(reportCode: string, filters: ReportFilters): Promise<ReportDataResult> {
    const provider = this.providerMap.get(reportCode);
    if (provider) return provider.getData(reportCode, filters);
    return this.getPlaceholderData(reportCode);
  }

  private getPlaceholderData(reportCode: string): ReportDataResult {
    return {
      title: `Report: ${reportCode}`,
      columns: [{ key: "message", label: "Info", width: 50 }],
      rows: [{ message: `Report '${reportCode}' not yet implemented.` }],
    };
  }
}
