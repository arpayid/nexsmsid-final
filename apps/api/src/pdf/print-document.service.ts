import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { DocumentTemplateService } from "./document-template.service";

export type PrintDocumentAction =
  | "invoice.print"
  | "payment.receipt.print"
  | "ppdb.proof.print"
  | "attendance.recap.print"
  | "grades.recap.print";

@Injectable()
export class PrintDocumentService {
  constructor(
    @Inject(DocumentTemplateService) private readonly templates: DocumentTemplateService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async renderInvoice(invoiceId: string) {
    return this.templates.renderInvoicePdf(invoiceId);
  }

  async renderPaymentReceipt(paymentId: string) {
    return this.templates.renderPaymentReceiptPdf(paymentId);
  }

  async renderPpdbProof(registrationId: string) {
    return this.templates.renderPpdbProofPdf(registrationId);
  }

  async renderAttendanceRecap(classroomId: string, startDate: Date, endDate: Date) {
    return this.templates.renderAttendanceRecapPdf(classroomId, startDate, endDate);
  }

  async renderGradeRecap(classroomId: string, semesterId?: string) {
    return this.templates.renderGradeRecapPdf(classroomId, semesterId);
  }

  async logPrint(
    action: PrintDocumentAction,
    entity: string,
    entityId: string,
    actor: AuthenticatedUser,
    meta: RequestMeta,
    extra: Record<string, string | number | boolean | null> = {},
  ) {
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action,
      entity,
      entityId,
      metadata: extra as never,
    });
  }
}
