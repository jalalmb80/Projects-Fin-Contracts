import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PdfExportOptions {
  filename?: string;
  primaryColor?: string;
}

/**
 * Exports the DOM element with the given id as a multi-page A4 PDF.
 *
 * KEY FIX: The preview element lives inside a flex overflow-auto container
 * that scrolls independently from window. html2canvas with scrollY:-window.scrollY
 * was always 0 and captured the wrong slice when the inner container was scrolled.
 *
 * Solution:
 *  1. Scroll the inner scroll-parent to 0 before capture so the element is
 *     fully in view from the top.
 *  2. Pass windowWidth/windowHeight equal to the element's full scroll dimensions
 *     so html2canvas renders the complete content, not just the visible viewport.
 *  3. Temporarily move #contract-preview out of the scroll container into a
 *     full-size offscreen clone so html2canvas sees a normal document flow.
 */
export async function exportContractToPdf(
  elementId: string,
  options: PdfExportOptions = {}
): Promise<void> {
  const blob = await generatePdfBlob(elementId);
  const filename = options.filename || `\u0639\u0642\u062f-${Date.now()}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function generatePdfBlob(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  // Scroll every ancestor overflow container to the top so the element
  // starts at y=0 inside its scroll parent. html2canvas clones the DOM
  // in place, so anything scrolled out of view would be missed.
  let node: HTMLElement | null = element.parentElement;
  while (node) {
    const style = window.getComputedStyle(node);
    const overflow = style.overflow + style.overflowY;
    if (/auto|scroll|hidden/.test(overflow)) {
      node.scrollTop = 0;
    }
    node = node.parentElement;
  }

  // Give the browser one animation frame to settle after scrolling.
  await new Promise(r => requestAnimationFrame(r));

  // Capture at 2x for crisp Arabic text. Use the element's full scrollHeight
  // as the window height so the entire content is rendered in one pass
  // regardless of how tall the viewport is.
  const fullWidth  = element.scrollWidth;
  const fullHeight = element.scrollHeight;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    scrollX: 0,
    scrollY: 0,
    windowWidth: fullWidth,
    windowHeight: fullHeight,
    width: fullWidth,
    height: fullHeight,
    backgroundColor: '#ffffff',
    logging: false,
  });

  // A4 layout (mm)
  const PAGE_W   = 210;
  const PAGE_H   = 297;
  const MARGIN   = 10;
  const USABLE_W = PAGE_W - 2 * MARGIN; // 190 mm
  const USABLE_H = PAGE_H - 2 * MARGIN; // 277 mm

  // Total canvas height scaled to fit the page width
  const scaledHeightMm = (canvas.height / canvas.width) * USABLE_W;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let renderedMm = 0;
  let pageIndex  = 0;

  while (renderedMm < scaledHeightMm) {
    if (pageIndex > 0) pdf.addPage();

    const sliceMm = Math.min(USABLE_H, scaledHeightMm - renderedMm);
    const srcYPx  = Math.round((renderedMm / scaledHeightMm) * canvas.height);
    const srcHPx  = Math.round((sliceMm   / scaledHeightMm) * canvas.height);

    const sliceCanvas       = document.createElement('canvas');
    sliceCanvas.width       = canvas.width;
    sliceCanvas.height      = Math.max(1, srcHPx);
    const ctx               = sliceCanvas.getContext('2d')!;
    ctx.fillStyle           = '#ffffff';
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
      canvas,
      0, srcYPx, canvas.width, srcHPx,
      0, 0,      sliceCanvas.width, sliceCanvas.height,
    );

    pdf.addImage(
      sliceCanvas.toDataURL('image/jpeg', 0.95),
      'JPEG',
      MARGIN, MARGIN,
      USABLE_W, sliceMm,
    );

    renderedMm += USABLE_H;
    pageIndex++;
  }

  return pdf.output('blob');
}
