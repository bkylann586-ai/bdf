import React, { useEffect } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { CompressPdfTool } from '../components/tools/CompressPdfTool';
import { getToolById } from '../lib/toolsCatalog';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';

const COMPRESS_PDF_FAQS: FaqSchemaItem[] = [
  {
    question: "Why didn't my PDF file size shrink in Lossless mode?",
    answer: 'Modern PDF generators (like Google Docs or Microsoft Word) already compress vector text and embedded fonts using Flate compression. When a PDF has no uncompressed streams or bloated images, lossless re-encoding cannot safely remove additional bytes without degrading content.',
  },
  {
    question: 'Which mode is best for scanned receipts, IDs, and paper documents?',
    answer: 'Choose "Balanced (Recommended)". It downsamples scanner images to a crisp 140 DPI and optimizes JPEG quantization, providing major size reduction while keeping all text easily legible.',
  },
  {
    question: 'Will text in my PDF remain searchable?',
    answer: 'In Lossless mode, vector text layers and embedded fonts are preserved. In Balanced or Maximum modes, pages are rendered into high-resolution images, so underlying text layers become rasterized.',
  },
  {
    question: 'Are there file size limits for compression?',
    answer: 'Because processing happens in browser memory, speed depends on your device CPU and available RAM. Standard documents process within seconds, while very large or multi-hundred-page documents require sufficient available RAM.',
  },
  {
    question: 'Does PDFQuick compress PDFs without losing quality?',
    answer: 'Yes! Lossless mode removes redundant metadata and duplicate streams without touching vector graphics or resolution. Balanced mode optimizes scanner resolution to 140 DPI, maintaining high readability while slashing file size.',
  },
];

export const CompressPdfPage: React.FC = () => {
  const tool = getToolById('compress-pdf')!;

  useEffect(() => {
    return injectFaqSchema(COMPRESS_PDF_FAQS, { toolId: tool.id });
  }, [tool.id]);

  const howToSteps = [
    {
      step: '1',
      title: 'Select PDF',
      description: 'Upload the PDF document you want to optimize. The initial file size is verified in your browser.',
    },
    {
      step: '2',
      title: 'Choose Compression Mode',
      description: 'Select "Balanced" for standard scanned papers and image-heavy PDFs, "Maximum" for small email attachments, or "Lossless" for vector documents.',
    },
    {
      step: '3',
      title: 'View Honest Results & Download',
      description: 'PDFQuick calculates exact byte savings. Download your optimized PDF immediately.',
    },
  ];

  const technicalDetails = [
    {
      title: 'Why Compression Results Vary',
      content: 'A PDF already composed purely of vector text with compact font subsets has almost no redundant data to compress. In contrast, scanned documents containing high-resolution 300+ DPI bitmaps can often be compressed by 40% to 75%.',
    },
    {
      title: 'Lossless vs. Raster Re-encoding',
      content: 'Lossless mode cleans unused catalog streams and dead references. Balanced and Maximum modes downsample large raster scans to standard web/print resolutions (~140 DPI and 100 DPI).',
    },
    {
      title: 'No False Claims or Guarantees',
      content: 'We never claim "Guaranteed 90% size reduction" because genuine compression depends on the underlying content structure. If a document is already optimal, PDFQuick tells you honestly.',
    },
    {
      title: 'Object Stream & Deflate Optimization',
      content: 'PDFQuick reorganizes uncompressed indirect object numbers into cross-reference streams and applies standard zlib DEFLATE compression to non-image object tables, reducing PDF structural overhead.',
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={COMPRESS_PDF_FAQS}
      technicalIntro="PDFQuick optimizes PDF size using dual compression pipelines: lossless indirect object stream deduplication for vector documents and adaptive raster re-quantization for scanned pages:"
    >
      <CompressPdfTool />
    </ToolLayout>
  );
};
