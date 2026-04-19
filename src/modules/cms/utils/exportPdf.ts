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
 * context from every ancestor, so even scrolled to 0 the canvas is clipped to
 * the scroll-container's visible height.
 *
 * Solution: clone the element into a body-level off-screen wrapper before
 * calling html2canvas. At body level there are no scroll-container ancestors,
 * so the full element height is captured in one pass.
 *
 * WIDTH NOTE:
 * getBoundingClientRect().width returns 0 when the element is itself off-screen
 * (e.g. ContractPreviewPortal in download mode renders at left:-9999px).
 * We therefore prefer scrollWidth, then offsetWidth, then fall back to 960.
 */
export async function exportContractToPdf(
  elementId: string,
  options: PdfExportOptions = {}
): Promise<void> {
  const blob = await generatePdfBlob(elementId);
  const filename = options.filename || `عقد-${Date.now()}.pdf`;

  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function generatePdfBlob(elementId: string): Promise<Blob> {
  const source = document.getElementById(elementId);
  if (!source) throw new Error(`Element #${elementId} not found`);

  // ── 1. Resolve width ─────────────────────────────────────────────────────────────
  // Prefer scrollWidth/offsetWidth over getBoundingClientRect because the
  // source element may be positioned off-screen (left:-9999px) and
  // getBoundingClientRect returns 0 in that case.
  const sourceWidth =
    source.scrollWidth ||
    source.offsetWidth ||
    Math.round(source.getBoundingClientRect().width) ||
    960;

  // ── 2. Clone into a body-level off-screen wrapper ──────────────────────────
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position:      'fixed',       // fixed keeps it in the viewport layer but
    top:           '0px',         // we immediately move it off-screen below
    left:          '-10000px',
    width:         `${Math.round(sourceWidth)}px`,
    background:    '#ffffff',
    zIndex:        '-1',
    overflow:      'visible',
    pointerEvents: 'none',
  });

  const clone = source.cloneNode(true) as HTMLElement;
  // Strip the sticky/fixed toolbar so it doesn’t affect layout.
  clone.querySelectorAll('.no-print').forEach(el => (el as HTMLElement).remove());

  // Reset any transform/translate on the clone itself.
  clone.style.transform = 'none';
  clone.style.position  = 'static';

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  // ── 3. Wait for layout: 2 rAF + 200 ms ─────────────────────────────────
  await new Promise<void>(resolve =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setTimeout(resolve, 200)
      )
    )
  );

  // ── 4. Measure the clone’s actual rendered height ──────────────────────────
  // Use the wrapper’s scrollHeight so we capture the full document height.
  const captureWidth  = wrapper.scrollWidth  || sourceWidth;
  const captureHeight = wrapper.scrollHeight || clone.scrollHeight || 1200;

  // Resize wrapper to exactly match measured dimensions (prevents html2canvas
  // from clipping if the element grew taller than the initial estimate).
  wrapper.style.width  = `${captureWidth}px`;
  wrapper.style.height = `${captureHeight}px`;

  // ── 5. Capture ──────────────────────────────────────────────────────────────────
  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(wrapper, {
      scale:           2,
      useCORS:         true,
      allowTaint:      true,
      scrollX:         0,
      scrollY:         0,
      width:           captureWidth,
      height:          captureHeight,
      windowWidth:     captureWidth,
      windowHeight:    captureHeight,
      backgroundColor: '#ffffff',
      logging:         false,
    });
  } finally {
    document.body.removeChild(wrapper);
  }

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error('html2canvas produced an empty canvas — nothing to export');
  }

  // ── 6. Slice canvas into A4 pages ─────────────────────────────────────────────
  const MARGIN   = 10;   // mm
  const USABLE_W = 190;  // mm (210 - 2×10)
  const USABLE_H = 277;  // mm (297 - 2×10)

  const scaledHeightMm = (canvas.height / canvas.width) * USABLE_W;

  const pdf  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let done   = 0;
  let page   = 0;

  while (done < scaledHeightMm) {
    if (page++ > 0) pdf.addPage();

    const sliceMm = Math.min(USABLE_H, scaledHeightMm - done);
    const srcY    = Math.round((done    / scaledHeightMm) * canvas.height);
    const srcH    = Math.round((sliceMm / scaledHeightMm) * canvas.height);

    const slice   = document.createElement('canvas');
    slice.width   = canvas.width;
    slice.height  = Math.max(1, srcH);
    const ctx     = slice.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
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
