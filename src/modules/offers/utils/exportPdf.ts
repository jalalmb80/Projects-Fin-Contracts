/**
 * offers/utils/exportPdf.ts — thin re-export from the shared core engine.
 * Resolves Phase 4 arch debt F (duplicated PDF engine across CMS and Offers).
 */
export {
  exportToPdf as exportOfferToPdf,
  generatePdfBlob as generateOfferPdfBlob,
} from '../../../core/utils/exportPdf';
export type { PdfExportOptions as OfferPdfExportOptions } from '../../../core/utils/exportPdf';
