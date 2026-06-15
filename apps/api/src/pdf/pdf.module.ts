import { Global, Module } from "@nestjs/common";

import { DocumentTemplateService } from "./document-template.service";
import { PdfService } from "./pdf.service";
import { PrintDocumentService } from "./print-document.service";

@Global()
@Module({
  providers: [PdfService, DocumentTemplateService, PrintDocumentService],
  exports: [PdfService, DocumentTemplateService, PrintDocumentService],
})
export class PdfModule {}
