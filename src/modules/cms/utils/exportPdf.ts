/**
 * cms/utils/exportPdf.ts — thin re-export from the shared core engine.
 * Resolves Phase 4 arch debt F (duplicated PDF engine across CMS and Offers).
 */
export {
  exportToPdf,
  generatePdfBlob,
} from '../../../core/utils/exportPdf';
export type { PdfExportOptions } from '../../../core/utils/exportPdf';
