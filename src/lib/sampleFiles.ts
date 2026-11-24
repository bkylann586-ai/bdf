import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generate a realistic multi-page sample PDF file for testing
 */
export async function createSamplePdf(
  title: string = 'Sample Document',
  pageCount: number = 3
): Promise<File> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    // Header bar
    page.drawRectangle({
      x: 40,
      y: height - 80,
      width: width - 80,
      height: 40,
      color: rgb(0.95, 0.97, 1.0),
    });

    page.drawText('PDFQuick Test Suite', {
      x: 50,
      y: height - 65,
      size: 11,
      font: boldFont,
      color: rgb(0.1, 0.4, 0.8),
    });

    page.drawText(`${title} – Page ${i} of ${pageCount}`, {
      x: 50,
      y: height - 130,
      size: 20,
      font: boldFont,
      color: rgb(0.1, 0.15, 0.25),
    });

    const bodyParagraphs = [
      `This is page ${i} of an authentic sample PDF generated locally inside your web browser.`,
      'This document contains standard vector typography, geometry, and layout structures suitable for testing merge, split, compression, and image conversion workflows.',
      'All processing runs client-side using JavaScript and HTML5 Canvas rendering engines. No data is transmitted to external servers.',
      `Checksum timestamp: ${new Date().toISOString()} | Section ID: 0x${Math.floor(Math.random() * 0xffffff).toString(16)}`,
    ];

    let currentY = height - 170;
    for (const paragraph of bodyParagraphs) {
      page.drawText(paragraph, {
        x: 50,
        y: currentY,
        size: 11,
        font,
        color: rgb(0.3, 0.35, 0.4),
        maxWidth: width - 100,
        lineHeight: 16,
      });
      currentY -= 40;
    }

    // Draw a visual test graphic
    page.drawRectangle({
      x: 50,
      y: currentY - 100,
      width: 140,
      height: 80,
      borderColor: rgb(0.2, 0.5, 0.9),
      borderWidth: 1.5,
      color: rgb(0.96, 0.98, 1.0),
    });

    page.drawText(`Page #${i} Block`, {
      x: 65,
      y: currentY - 60,
      size: 12,
      font: boldFont,
      color: rgb(0.1, 0.3, 0.7),
    });

    // Page footer
    page.drawText(`Page ${i} of ${pageCount} · PDFQuick Local Processing Engine`, {
      x: 50,
      y: 40,
      size: 9,
      font,
      color: rgb(0.5, 0.55, 0.6),
    });
  }

  const bytes = await doc.save();
  const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return new File([bytes.buffer as ArrayBuffer], `${safeName}-${pageCount}p.pdf`, {
    type: 'application/pdf',
  });
}

/**
 * Generate a sample JPG/PNG image File for testing Images-to-PDF
 */
export function createSampleImage(
  title: string = 'Sample Photo',
  width: number = 800,
  height: number = 600,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg'
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Clean gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Inner card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(40, 40, width - 80, height - 80);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(title, 70, 110);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Resolution: ${width} × ${height}px`, 70, 150);
    ctx.fillText('Generated locally in browser for PDFQuick conversion test', 70, 185);

    // Visual shapes
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(70, 220, 240, 140);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '16px monospace';
    ctx.fillText('Sample Graphical Asset', 85, 295);

    canvas.toBlob(
      (blob) => {
        const ext = format === 'image/jpeg' ? 'jpg' : 'png';
        const file = new File([blob!], `${title.toLowerCase().replace(/\s+/g, '-')}.${ext}`, {
          type: format,
        });
        resolve(file);
      },
      format,
      0.9
    );
  });
}

/**
 * Generate a 2-page scanned-style image-only PDF (no embedded text layer)
 * so users can test Tesseract.js OCR recognition immediately in the browser.
 */
export async function createSampleScannedPdf(): Promise<File> {
  if (typeof document === 'undefined') {
    throw new Error('Scanned sample generation requires a browser canvas environment.');
  }

  const doc = await PDFDocument.create();
  const samplePages = [
    {
      heading: 'INVOICE #PQ-2026-0418',
      sub: 'ACME LOGISTICS LLC · 742 MARKET ST, SAN FRANCISCO, CA 94103',
      lines: [
        'Bill To: Northstar Advisory Group',
        'Statement Period: November 1 - November 30, 2026',
        '1. Annual Cloud Archive & Audit Bundle ........... $1,250.00',
        '2. Compliance Document Verification Fee .......... $340.00',
        'Subtotal: $1,590.00 | Tax (0.0%): $0.00',
        'Total Amount Due: $1,590.00 USD',
        'Payment Reference: ACH-88412-VERIFIED',
      ],
    },
    {
      heading: 'DELIVERY CONFIRMATION MEMO',
      sub: 'PAGE 2 OF 2 · SCANNED RASTER RECORD (NO VECTOR TEXT)',
      lines: [
        'This sample page was rasterized onto an off-screen HTML5 canvas',
        'and embedded purely as a PNG bitmap image with zero PDF text',
        'operators. Optical Character Recognition (OCR) is required to',
        'extract these words and build a searchable PDF text layer.',
        'Signed by: Jordan Taylor · Date: 2026-11-23',
      ],
    },
  ];

  for (const pageSpec of samplePages) {
    const canvas = document.createElement('canvas');
    canvas.width = 1190;
    canvas.height = 1684;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not initialize 2D canvas context for sample scan.');
    }

    // Crisp off-white paper look
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.strokeRect(64, 64, canvas.width - 128, canvas.height - 128);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(pageSpec.heading, 110, 180);

    ctx.fillStyle = '#334155';
    ctx.font = '600 22px monospace';
    ctx.fillText(pageSpec.sub, 110, 235);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(110, 270);
    ctx.lineTo(canvas.width - 110, 270);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '28px sans-serif';
    let y = 360;
    for (const line of pageSpec.lines) {
      ctx.fillText(line, 110, y);
      y += 72;
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to encode sample scan image'))),
        'image/png'
      );
    });

    const pngBytes = new Uint8Array(await blob.arrayBuffer());
    canvas.width = 0;
    canvas.height = 0;

    const img = await doc.embedPng(pngBytes);
    const page = doc.addPage([595.28, 841.89]);
    page.drawImage(img, { x: 0, y: 0, width: 595.28, height: 841.89 });
  }

  const pdfBytes = await doc.save();
  return new File([pdfBytes.buffer as ArrayBuffer], 'sample-scanned-invoice-2p.pdf', {
    type: 'application/pdf',
  });
}

