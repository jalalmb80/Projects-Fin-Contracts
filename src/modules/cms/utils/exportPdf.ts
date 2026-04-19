import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PdfExportOptions {
  filename?: string;
  primaryColor?: string;
}

/**
 * Tailwind v4 uses oklch() color values throughout its CSS custom properties.
 * html2canvas does not support oklch() and throws immediately when it
 * encounters one. The fix is to resolve every computed color on every element
 * in the clone to an rgb/rgba string using a throwaway canvas (which the
 * browser resolves correctly), then inline those values as style attributes
 * before handing the clone to html2canvas.
 *
 * The color properties we care about for a contract PDF:
 *   color, background-color, border-color (all four sides), outline-color,
 *   fill, stroke, text-decoration-color, caret-color
 */

// ── oklch resolver ─────────────────────────────────────────────────────────────
// A single shared off-screen canvas element used to resolve oklch → rgb.
let _resolverCtx: CanvasRenderingContext2D | null = null;
function getResolverCtx(): CanvasRenderingContext2D {
  if (!_resolverCtx) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    _resolverCtx = c.getContext('2d')!;
  }
  return _resolverCtx;
}

/**
 * If `color` contains "oklch", ask the browser to resolve it to an rgb string
 * by painting a 1x1 canvas with that color and reading the result back.
 * Returns the original string unchanged for anything the browser can’t paint
 * or that doesn’t contain "oklch".
 */
function resolveColor(color: string): string {
  if (!color || !color.includes('oklch')) return color;
  try {
    const ctx = getResolverCtx();
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    // getImageData gives us [r, g, b, a]
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return a < 255
      ? `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`
      : `rgb(${r},${g},${b})`;
  } catch {
    return color;
  }
}

const COLOR_PROPS = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
  'caretColor',
  'fill',
  'stroke',
] as const;

/**
 * Walk every element in `root` and replace any oklch computed color with its
 * resolved rgb equivalent inlined as a style attribute.
 * Only touches elements that actually have an oklch value — skips everything
 * else to keep the pass fast.
 */
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

// ── public API ───────────────────────────────────────────────────────────────

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

  // ── 1. Resolve source width ─────────────────────────────────────────────────
  // getBoundingClientRect returns 0 when the element is off-screen, so prefer
  // scrollWidth / offsetWidth first.
  const sourceWidth =
    source.scrollWidth ||
    source.offsetWidth ||
    Math.round(source.getBoundingClientRect().width) ||
    960;

  // ── 2. Clone into a body-level off-screen wrapper ─────────────────────────
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position:      'fixed',
    top:           '0px',
    left:          '-10000px',
    width:         `${Math.round(sourceWidth)}px`,
    background:    '#ffffff',
    zIndex:        '-1',
    overflow:      'visible',
    pointerEvents: 'none',
  });

  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.no-print').forEach(el => (el as HTMLElement).remove());
  clone.style.transform = 'none';
  clone.style.position  = 'static';

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  // ── 3. Wait for layout (2 rAF + 300 ms for fonts/images) ──────────────────
  await new Promise<void>(resolve =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setTimeout(resolve, 300)
      )
    )
  );

  // ── 4. Resolve all oklch colors ────────────────────────────────────────────
  // Must be done AFTER the wrapper is in the DOM (so getComputedStyle works)
  // and BEFORE calling html2canvas.
  resolveOklchColors(wrapper);

  // ── 5. Measure actual rendered dimensions ──────────────────────────────
  const captureWidth  = wrapper.scrollWidth  || sourceWidth;
  const captureHeight = wrapper.scrollHeight || clone.scrollHeight || 1200;
  wrapper.style.width  = `${captureWidth}px`;
  wrapper.style.height = `${captureHeight}px`;

  // ── 6. Capture ───────────────────────────────────────────────────────────────
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

  // ── 7. Slice canvas into A4 pages ─────────────────────────────────────────
  const MARGIN   = 10;
  const USABLE_W = 190;
  const USABLE_H = 277;

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
