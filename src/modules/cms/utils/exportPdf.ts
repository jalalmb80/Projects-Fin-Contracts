import html2pdf from 'html2pdf.js';

export interface PdfExportOptions {
  filename?: string;
  primaryColor?: string;
}

export async function exportContractToPdf(
  elementId: string,
  options: PdfExportOptions = {}
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  const filename = options.filename || `عقد-${Date.now()}.pdf`;

  const opt = {
    margin:       10,
    filename:     filename,
    image:        { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      scrollY: 0,
      backgroundColor: '#ffffff',
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait' as const,
      compress: true,
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.contract-page-break',
    },
  };

  await html2pdf().set(opt).from(element).save();
}

export async function generatePdfBlob(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  const opt = {
    margin: 10,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollY: 0,
      backgroundColor: '#ffffff',
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait' as const,
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.contract-page-break',
    },
  };

  return await html2pdf().set(opt).from(element).outputPdf('blob');
}
