/**
 * exportPdf.ts — Offers module PDF export engine.
 *
 * Identical pipeline to src/modules/cms/utils/exportPdf.ts.
 * Kept module-local to preserve offers ↔ CMS independence.
 * Phase 4 may extract the shared engine to src/core/utils/exportPdf.ts.
 *
 * Uses html2canvas + jsPDF (already in the bundle via the CMS module).
 * Works around Tailwind v4's oklch() color values which html2canvas cannot
 * parse — resolves every oklch computed color to rgb before capture.
 */
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface OfferPdfExportOptions {
  filename?: string;
}

// ── oklch → rgb resolver ──────────────────────────────────────────────────────
// Tailwind v4 CSS custom properties use oklch(); html2canvas throws on them.
// Strategy: walk every element in the clone, read computedStyle, resolve any
// oklch value to rgb via a throwaway 1×1 canvas, then inline the result.

let _resolverCtx: CanvasRenderingContext2D | null = null;
function getResolverCtx(): CanvasRenderingContext2D {
  if (!_resolverCtx) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    _resolverCtx = c.getContext('2d')!;
  }
  return _resolverCtx;
}

function resolveColor(color: string): string {
  if (!color || !color.includes('oklch')) return color;
  try {
    const ctx = getResolverCtx();
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return a < 255
      ? `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`
      : `rgb(${r},${g},${b})`;
  } catch {
    return color;
  }
}

const COLOR_PROPS = [
  'color', 'backgroundColor',
  'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
  'outlineColor', 'textDecorationColor', 'caretColor', 'fill', 'stroke',
] as const;

function resolveOklchColors(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node: Node | null = walker.currentNode;
  while (node) {
    const el = node as HTMLElement;
    if (el.style !== undefined) {
      const computed = window.getComputedStyle(el);
      for (const prop of COLOR_PROPS) {
        const value = computed[prop as keyof CSSStyleDeclaration] as string;
        if (value && value.includes('oklch')) {
          (el.style as any)[prop] = resolveColor(value);
        }
      }
    }
    node = walker.nextNode();
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Render element → A4 PDF → trigger browser download. */
export async function exportOfferToPdf(
  elementId: string,
  options: OfferPdfExportOptions = {},
): Promise<void> {
  const blob     = await generateOfferPdfBlob(elementId);
  const filename = options.filename || `offer-${Date.now()}.pdf`;
  const url      = URL.createObjectURL(blob);
  const link     = document.createElement('a');
  link.href      = url;
  link.download  = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Render element → A4 PDF → return Blob (for upload / preview). */
export async function generateOfferPdfBlob(elementId: string): Promise<Blob> {
  const source = document.getElementById(elementId);
  if (!source) throw new Error(`Element #${elementId} not found`);

  const sourceWidth =
    source.scrollWidth ||
    source.offsetWidth ||
    Math.round(source.getBoundingClientRect().width) ||
    960;

  // Clone into off-screen wrapper
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position: 'fixed', top: '0px', left: '-10000px',
    width: `${Math.round(sourceWidth)}px`,
    background: '#ffffff', zIndex: '-1',
    overflow: 'visible', pointerEvents: 'none',
  });
  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.no-print').forEach(el => (el as HTMLElement).remove());
  clone.style.transform = 'none';
  clone.style.position  = 'static';
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  // Wait for layout
  await new Promise<void>(resolve =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setTimeout(resolve, 300)),
    ),
  );

  // Resolve oklch after element is in DOM
  resolveOklchColors(wrapper);

  const captureWidth  = wrapper.scrollWidth  || sourceWidth;
  const captureHeight = wrapper.scrollHeight || clone.scrollHeight || 1200;
  wrapper.style.width  = `${captureWidth}px`;
  wrapper.style.height = `${captureHeight}px`;

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(wrapper, {
      scale: 2, useCORS: true, allowTaint: true,
      scrollX: 0, scrollY: 0,
      width: captureWidth, height: captureHeight,
      windowWidth: captureWidth, windowHeight: captureHeight,
      backgroundColor: '#ffffff', logging: false,
    });
  } finally {
    document.body.removeChild(wrapper);
  }

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error('html2canvas produced an empty canvas');
  }

  // Slice into A4 pages
  const MARGIN   = 10;
  const USABLE_W = 190;
  const USABLE_H = 277;
  const scaledH  = (canvas.height / canvas.width) * USABLE_W;

  const pdf  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let done   = 0;
  let page   = 0;

  while (done < scaledH) {
    if (page++ > 0) pdf.addPage();
    const sliceMm = Math.min(USABLE_H, scaledH - done);
    const srcY    = Math.round((done    / scaledH) * canvas.height);
    const srcH    = Math.round((sliceMm / scaledH) * canvas.height);
    const slice   = document.createElement('canvas');
    slice.width   = canvas.width;
    slice.height  = Math.max(1, srcH);
    const ctx     = slice.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, slice.width, slice.height);
    pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', MARGIN, MARGIN, USABLE_W, sliceMm);
    done += USABLE_H;
  }

  return pdf.output('blob');
}
