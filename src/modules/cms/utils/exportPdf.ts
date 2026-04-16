import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PdfExportOptions {
  filename?: string;
  primaryColor?: string;
}

/**
 * WHY THE CLONE APPROACH:
 *
 * #contract-preview lives inside ContractEditor's `div.flex-1.overflow-auto`
 * scroll panel. html2canvas traverses the DOM and inherits the overflow/clip
 * context from every ancestor — so even if we scroll the container to 0, the
 * rendered canvas is clipped to the scroll-container's visible height.
 *
 * Solution: clone the element into a body-level off-screen wrapper before
 * calling html2canvas. At body level there are no scroll-container ancestors,
 * so the full element height is captured in one pass. The clone is removed
 * immediately after capture regardless of success or failure.
 *
 * Tailwind classes work on the clone because the global stylesheet applies to
 * all elements in the document regardless of where they are in the DOM tree.
 */
export async function exportContractToPdf(
  elementId: string,
  options: PdfExportOptions = {}
): Promise<void> {
  const blob = await generatePdfBlob(elementId);
  const filename = options.filename || `عقد-${Date.now()}.pdf`;

  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href  = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke after a tick so the download has time to start
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function generatePdfBlob(elementId: string): Promise<Blob> {
  const source = document.getElementById(elementId);
  if (!source) throw new Error(`Element #${elementId} not found`);

  // ── 1. Clone into a body-level off-screen wrapper ──────────────────────────
  //
  // Width matches the source element's rendered width so text wrapping is
  // identical to what the user sees in the preview.
  const sourceWidth = source.getBoundingClientRect().width || source.scrollWidth || 900;

  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position:       'absolute',
    top:            '0px',
    left:           '-10000px',   // off-screen horizontally
    width:          `${Math.round(sourceWidth)}px`,
    background:     '#ffffff',
    zIndex:         '-1',
    overflow:       'visible',    // no clipping
    pointerEvents:  'none',
  });

  const clone = source.cloneNode(true) as HTMLElement;
  // Remove any sticky / fixed positioning from .no-print toolbar so it
  // doesn't offset the rendering. The toolbar buttons are hidden anyway
  // via the .no-print class but removing them avoids layout side-effects.
  clone.querySelectorAll('.no-print').forEach(el => (el as HTMLElement).remove());

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  // ── 2. Wait two animation frames for layout to settle ─────────────────────
  await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  // ── 3. Capture ─────────────────────────────────────────────────────────────
  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(wrapper, {
      scale:           2,          // 2× for crisp Arabic text
      useCORS:         true,
      allowTaint:      true,
      scrollX:         0,
      scrollY:         0,
      backgroundColor: '#ffffff',
      logging:         false,
    });
  } finally {
    // Always clean up the clone, even if html2canvas threw
    document.body.removeChild(wrapper);
  }

  // Guard against degenerate canvas (shouldn't happen but prevents ÷0)
  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error('html2canvas produced an empty canvas — nothing to export');
  }

  // ── 4. Slice canvas into A4 pages ─────────────────────────────────────────
  const MARGIN   = 10;           // mm
  const USABLE_W = 190;          // mm  (210 - 2×10)
  const USABLE_H = 277;          // mm  (297 - 2×10)

  // How many mm tall is the full canvas when scaled to fit USABLE_W?
  const scaledHeightMm = (canvas.height / canvas.width) * USABLE_W;

  const pdf  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let done   = 0;
  let page   = 0;

  while (done < scaledHeightMm) {
    if (page++ > 0) pdf.addPage();

    const sliceMm = Math.min(USABLE_H, scaledHeightMm - done);
    const srcY    = Math.round((done    / scaledHeightMm) * canvas.height);
    const srcH    = Math.round((sliceMm / scaledHeightMm) * canvas.height);

    const slice        = document.createElement('canvas');
    slice.width        = canvas.width;
    slice.height       = Math.max(1, srcH);
    const ctx          = slice.getContext('2d')!;
    ctx.fillStyle      = '#ffffff';
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, slice.width, slice.height);

    pdf.addImage(
      slice.toDataURL('image/jpeg', 0.95),
      'JPEG',
      MARGIN, MARGIN,
      USABLE_W, sliceMm,
    );

    done += USABLE_H;
  }

  return pdf.output('blob');
}
