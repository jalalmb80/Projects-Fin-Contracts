/**
 * cms/utils/exportPdf.ts — thin re-export from the shared core engine.
 * Resolves Phase 4 arch debt F (duplicated PDF engine across CMS and Offers).
 *
 * exportContractToPdf: alias kept for ContractPreviewPortal.tsx back-compat.
 */
export {
  exportToPdf,
  exportToPdf as exportContractToPdf,
  generatePdfBlob,
} from '../../../core/utils/exportPdf';
export type { PdfExportOptions } from '../../../core/utils/exportPdf';
