import React, { useEffect } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { PdfToImagesTool } from '../components/tools/PdfToImagesTool';
import { getToolById } from '../lib/toolsCatalog';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';

const PDF_TO_IMAGES_FAQS: FaqSchemaItem[] = [
  {
    question: 'Should I choose PNG or JPEG format?',
    answer: 'Choose PNG for documents with small text, line diagrams, or sharp screenshots where you want zero compression artifacts. Choose JPEG for photo-heavy documents to keep file sizes compact.',
  },
  {
    question: 'Can I extract only specific pages instead of the whole document?',
    answer: 'Yes! Select "Specific Page Range" in the options and type e.g. "1-3, 5". Only those requested pages will be rendered and downloaded.',
  },
  {
    question: 'Why download as a ZIP file?',
    answer: 'For multi-page PDFs (e.g. 10 or 20 pages), downloading as a single ZIP archive saves you from having to confirm multiple browser download dialogs.',
  },
  {
    question: 'What is the maximum resolution available?',
    answer: 'The "Ultra Crisp (3.0x)" setting renders pages at approximately 220–300 DPI, making it suitable for professional print preparation and OCR.',
  },
  {
    question: 'Can I extract images from PDF for free without watermarks?',
    answer: 'Yes! PDFQuick converts your PDF pages to high-resolution PNG or JPEG images completely free with no watermarks, no signups, and 100% private in-browser rendering.',
  },
];

export const PdfToImagesPage: React.FC = () => {
  const tool = getToolById('pdf-to-images')!;

  useEffect(() => {
    return injectFaqSchema(PDF_TO_IMAGES_FAQS, { toolId: tool.id });
  }, [tool.id]);

  const howToSteps = [
    {
      step: '1',
      title: 'Select PDF',
      description: 'Upload the PDF document you want to convert into images.',
    },
    {
      step: '2',
      title: 'Choose Format & Resolution',
      description: 'Select PNG (lossless, highest clarity) or JPEG (compact), plus your desired scale factor (1.5x, 2.0x, or 3.0x).',
    },
    {
      step: '3',
      title: 'Download Images or ZIP',
      description: 'Save individual page photos or click "Download All as ZIP" to get every page bundled in a single compressed archive.',
    },
  ];

  const technicalDetails = [
    {
      title: 'Vector-to-Raster Canvas Engine',
      content: 'PDFQuick uses PDF.js to render PDF vector primitives, glyphs, and embedded bitmap layers onto HTML5 offscreen canvases at high fidelity.',
    },
    {
      title: 'Super-Sampling Resolution Options',
      content: 'Scale factors of 1.5x (~110 DPI), 2.0x (~150 DPI), and 3.0x (~220 DPI) ensure crisp text and sharp lines suitable for presentations and OCR.',
    },
    {
      title: 'Single-Click ZIP Compression',
      content: 'Rendered image blobs are compiled on-the-fly into a standard Deflate ZIP archive in browser memory, avoiding hundreds of individual popups.',
    },
    {
      title: 'Canvas Font Hinting & Anti-Aliasing',
      content: 'The rendering engine extracts embedded Type1, TrueType, and CFF glyph curves, applying sub-pixel anti-aliasing and hinting routines to produce sharp letterforms even at high optical zoom levels.',
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={PDF_TO_IMAGES_FAQS}
      technicalIntro="PDFQuick converts vector PDF pages into raster bitmap images by evaluating PDF graphics state commands, path operators, and font glyph outlines directly in HTML5 canvas buffers:"
    >
      <PdfToImagesTool />
    </ToolLayout>
  );
};
