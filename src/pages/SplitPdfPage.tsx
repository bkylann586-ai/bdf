import React, { useEffect } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { SplitPdfTool } from '../components/tools/SplitPdfTool';
import { getToolById } from '../lib/toolsCatalog';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';

const SPLIT_PDF_FAQS: FaqSchemaItem[] = [
  {
    question: 'How do I extract only page 1 and page 4?',
    answer: 'Select "Custom Page Range" and enter "1, 4" in the range input field. PDFQuick will assemble a new 2-page document with just those pages.',
  },
  {
    question: 'How does splitting every page work?',
    answer: 'Choosing "Separate Every Page" turns each page into an independent 1-page PDF document. All files are bundled into a convenient .zip archive.',
  },
  {
    question: 'Do hyperlinks and bookmarks stay intact?',
    answer: 'Hyperlinks to external websites stay functional. Internal bookmarks referencing pages that were excluded will be safely cleaned up.',
  },
  {
    question: 'Is my data secure when splitting sensitive contracts?',
    answer: 'Yes. Files never leave your browser sandbox. No server logs, no cloud storage, and no tracking scripts access your document.',
  },
  {
    question: 'Can I split large multi-page PDF documents?',
    answer: 'Yes! PDFQuick handles multi-page documents directly within your browser memory without file upload limits, server timeouts, or subscription paywalls.',
  },
];

export const SplitPdfPage: React.FC = () => {
  const tool = getToolById('split-pdf')!;

  useEffect(() => {
    return injectFaqSchema(SPLIT_PDF_FAQS, { toolId: tool.id });
  }, [tool.id]);

  const howToSteps = [
    {
      step: '1',
      title: 'Upload Document',
      description: 'Select the PDF document you want to split or extract pages from. Page count is calculated in real time.',
    },
    {
      step: '2',
      title: 'Pick Split Mode',
      description: 'Choose to extract custom page ranges (e.g. 1-3, 5), extract every page individually, or divide into equal chunks.',
    },
    {
      step: '3',
      title: 'Download Result',
      description: 'Download the extracted single PDF or the auto-generated ZIP archive containing all separated documents.',
    },
  ];

  const technicalDetails = [
    {
      title: 'Page Tree Parsing',
      content: 'PDFQuick parses the document Page Tree (Pages dictionary) directly in memory, slicing out requested page nodes into independent PDF structures.',
    },
    {
      title: 'In-Browser ZIP Packaging',
      content: 'When generating multiple separated files, a browser-side deflate compression engine (JSZip) packages files directly into a single .zip download.',
    },
    {
      title: 'Range Syntax Support',
      content: 'Supports individual pages (e.g. "1, 3, 5") and closed intervals (e.g. "2-6"). Duplicates and out-of-bound pages are safely validated.',
    },
    {
      title: 'Resource Isolation',
      content: 'Extracted files retain only the font and image resources associated with the chosen pages, minimizing output footprint.',
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={SPLIT_PDF_FAQS}
      technicalIntro="PDFQuick splits PDF documents by traversing the document page tree hierarchy, copying required page dictionaries, and synthesizing clean standalone PDF structures in memory:"
    >
      <SplitPdfTool />
    </ToolLayout>
  );
};
