import React, { useEffect } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { OcrPdfTool } from '../components/tools/OcrPdfTool';
import { getToolById } from '../lib/toolsCatalog';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';

const OCR_PDF_FAQS: FaqSchemaItem[] = [
  {
    question: 'Does PDFQuick OCR upload my scanned PDF to a cloud OCR API?',
    answer:
      'No. Your PDF pages are rasterized locally on HTML5 canvases and analyzed by an in-browser Tesseract.js WebAssembly worker. Only the public OCR language dictionary (traineddata) is fetched once and cached locally by your browser—your documents never leave your device.',
  },
  {
    question: 'What is the difference between Smart Hybrid and Force OCR mode?',
    answer:
      'Smart Hybrid inspects each selected page first via PDF.js. If a page already contains selectable digital vector text, PDFQuick extracts that exact text immediately without slowing down on optical recognition. Force OCR re-renders every page and runs Tesseract OCR even on digital pages.',
  },
  {
    question: 'What output formats can I download after OCR finishes?',
    answer:
      'You can download a Searchable PDF (which preserves your original scanned pages visually while embedding an invisible, selectable Unicode text layer underneath) as well as a clean Plain Text (.txt) transcript or copy the extracted text directly to your clipboard.',
  },
  {
    question: 'Which languages are supported by PDFQuick OCR?',
    answer:
      'PDFQuick supports English, Arabic, Spanish, French, German, plus bilingual combinations (English + Arabic, English + Spanish, English + French). Searchable PDF exports embed Noto Sans and Noto Sans Arabic fonts so recognized Latin and Arabic characters copy cleanly.',
  },
  {
    question: 'Why does the first OCR run take a few extra seconds?',
    answer:
      'To keep PDFQuick fast and lightweight for everyday tools, the Tesseract WebAssembly core and selected language model are loaded lazily only when you run OCR, then cached locally in your browser IndexedDB for faster repeat runs.',
  },
];

export const OcrPdfPage: React.FC = () => {
  const tool = getToolById('ocr-pdf')!;

  useEffect(() => {
    return injectFaqSchema(OCR_PDF_FAQS, { toolId: tool.id });
  }, [tool.id]);

  const howToSteps = [
    {
      step: '1',
      title: 'Upload Scanned PDF',
      description:
        'Select or drop a scanned PDF (receipts, statements, contracts, or photocopies), or test immediately with the built-in 2-page scanned sample.',
    },
    {
      step: '2',
      title: 'Choose Language & Strategy',
      description:
        'Pick your document language (e.g., English, Arabic, Spanish, or bilingual), select Smart Hybrid or Force OCR mode, and optionally specify a page range.',
    },
    {
      step: '3',
      title: 'Export Text or Searchable PDF',
      description:
        'Inspect extracted text page by page, copy passages to your clipboard, download a .TXT file, or save a Searchable PDF with an invisible Unicode text layer.',
    },
  ];

  const technicalDetails = [
    {
      title: 'Lazy-Loaded Tesseract.js LSTM Worker',
      content:
        'Uses a single reusable LSTM WebAssembly worker instantiated on demand and terminated immediately upon completion or cancellation to keep initial app bundles light and RAM usage flat.',
    },
    {
      title: 'Smart Hybrid Text-Layer Short-Circuit',
      content:
        'Automatically detects existing vector text via PDF.js getTextContent() so mixed digital-plus-scan packets skip unnecessary image recognition on already-searchable pages.',
    },
    {
      title: 'Invisible Searchable PDF Layer',
      content:
        'Word bounding boxes extracted by Tesseract are mapped back into PDF CropBox coordinates using pdf-lib and Noto Sans / Noto Sans Arabic fonts at zero opacity, preserving original scan imagery.',
    },
    {
      title: 'Clamped Canvas Memory Management',
      content:
        'Each rendered page canvas is capped at 10 MP and explicitly zeroed out in memory immediately after recognition completes, preventing mobile browser tab crashes on long packets.',
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={OCR_PDF_FAQS}
      technicalIntro="PDFQuick performs optical character recognition locally by pairing PDF.js page rasterization with a single reusable Tesseract.js LSTM WebAssembly worker:"
    >
      <OcrPdfTool />
    </ToolLayout>
  );
};
