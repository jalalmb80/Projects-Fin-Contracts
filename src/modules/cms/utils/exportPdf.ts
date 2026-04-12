import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PdfExportOptions {
  filename?: string;
  primaryColor?: string;
}

/**
 * Exports the DOM element with the given id as a multi-page A4 PDF and
 * triggers a browser download.
 *
 * WHY NOT html2pdf.js:
 * html2pdf.js is CommonJS-only and has no ESM exports. Vite 6 in ESM mode
 * cannot import it without explicit optimizeDeps config, causing a silent
 * failure (export is undefined). It also bundles its own jsPDF v2.x which
 * conflicts with the installed jspdf@4.x. We use html2canvas + jspdf
 * directly — both ship proper ESM and are already in package.json.
 */
export async function exportContractToPdf(
  elementId: string,
  options: PdfExportOptions = {}
): Promise<void> {
  const blob = await generatePdfBlob(elementId);
  const filename = options.filename || `عقد-${Date.now()}.pdf`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke after a tick so the download has time to start
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function generatePdfBlob(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  // Render element to canvas at 2× for crisp text
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    // Compensate for current scroll so the full element is captured
    scrollY: -window.scrollY,
    backgroundColor: '#ffffff',
    logging: false,
  });

  // A4 layout constants (mm)
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 10;
  const USABLE_W = PAGE_W - 2 * MARGIN; // 190 mm
  const USABLE_H = PAGE_H - 2 * MARGIN; // 277 mm

  // px-per-mm at the effective DPI (96 dpi × scale 2)
  const PX_PER_MM = (96 * 2) / 25.4; // ≈ 7.559

  // How many mm tall is the full canvas when fitted to page width?
  const scaledHeightMm = (canvas.height / canvas.width) * USABLE_W;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let renderedMm = 0; // how many mm of the image have been placed
  let pageIndex = 0;

  while (renderedMm < scaledHeightMm) {
    if (pageIndex > 0) pdf.addPage();

    // Height of this page's slice in mm (last page may be shorter)
    const sliceMm = Math.min(USABLE_H, scaledHeightMm - renderedMm);

    // Corresponding source pixel coordinates in the original canvas
    const srcY = Math.round((renderedMm / USABLE_W) * canvas.width * (canvas.height / canvas.height) * (USABLE_W / scaledHeightMm) * (renderedMm / scaledHeightMm) * canvas.height);
    // Simpler: srcY is the proportion of the canvas height
    const srcYPx = Math.round((renderedMm / scaledHeightMm) * canvas.height);
    const srcHPx = Math.round((sliceMm / scaledHeightMm) * canvas.height);

    // Draw this slice onto a temporary canvas
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = srcHPx;
    const ctx = sliceCanvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
      canvas,
      0, srcYPx,           // source x, y
      canvas.width, srcHPx, // source width, height
      0, 0,                 // dest x, y
      sliceCanvas.width, sliceCanvas.height, // dest width, height
    );

    pdf.addImage(
      sliceCanvas.toDataURL('image/jpeg', 0.98),
      'JPEG',
      MARGIN, MARGIN,       // x, y on page
      USABLE_W, sliceMm,    // width, height on page
    );

    renderedMm += USABLE_H;
    pageIndex++;
  }

  return pdf.output('blob');
}
