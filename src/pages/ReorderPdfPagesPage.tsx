import React, { useEffect } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { ReorderPagesTool } from '../components/tools/ReorderPagesTool';
import { getToolById } from '../lib/toolsCatalog';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';

const REORDER_PAGES_FAQS: FaqSchemaItem[] = [
  {
    question: 'How can I fix backward or out-of-order pages after scanning a stack of paper?',
    answer: 'Load your scanned PDF into Reorder PDF Pages, click "Reverse Order" if your scanner fed the stack backward from bottom to top, or use the Up and Down buttons on individual pages to arrange the exact reading sequence.',
  },
  {
    question: 'Can I also drop an extra page while reordering my PDF?',
    answer: 'Yes. Each page row includes Move Up, Move Down, and Remove buttons so you can simultaneously arrange exhibit order and omit stray divider pages (as long as at least 1 page remains).',
  },
  {
    question: 'Is page reordering accessible via keyboard without mouse drag-and-drop?',
    answer: 'Yes. Every Up, Down, Reverse, Reset, and Remove control is a standard focusable button with clear aria-labels, making sequence editing effortless with keyboard Tab/Enter navigation or trackpads.',
  },
  {
    question: 'Does rearranging pages alter text quality or break fillable PDF content?',
    answer: 'No. PDFQuick copies existing page objects directly into a new page tree order using lossless in-browser processing, preserving resolution, typography, and embedded scans.',
  },
  {
    question: 'Can I reorder confidential pitch decks or court bundles safely here?',
    answer: 'Yes. Your file stays exclusively inside your browser tab memory. Nothing is uploaded, cached remotely, or shared with third parties.',
  },
];

export const ReorderPdfPagesPage: React.FC = () => {
  const tool = getToolById('reorder-pdf-pages')!;

  useEffect(() => {
    return injectFaqSchema(REORDER_PAGES_FAQS, { toolId: tool.id });
  }, [tool.id]);

  const howToSteps = [
    {
      step: '1',
      title: 'Select Multi-Page PDF',
      description: 'Upload or drop your PDF document (up to 250 MB) to list every page sequentially in your browser.',
    },
    {
      step: '2',
      title: 'Move, Reverse, or Trim',
      description: 'Use the Up and Down arrow buttons to swap page positions, click Reverse Order for backward scans, or Reset anytime.',
    },
    {
      step: '3',
      title: 'Export Reordered PDF',
      description: 'Click Save Reordered PDF to rebuild the PDF document catalog in your chosen sequence.',
    },
  ];

  const technicalDetails = [
    {
      title: 'Direct Index Remapping',
      content: 'Copies page dictionaries using an exact 1-based sequence map into a clean PDFDocument output structure.',
    },
    {
      title: 'One-Click Duplex Reversal',
      content: 'Instantly flips back-to-front office scanner batches into chronological page order without manual swapping.',
    },
    {
      title: 'Keyboard-Friendly Controls',
      content: 'Built with accessible Move Up, Move Down, and Remove buttons that work reliably on desktop, laptop trackpads, and touch screens.',
    },
    {
      title: 'Zero Raster Degradation',
      content: 'Reordering performs pure structural copying—no Canvas re-rendering or JPEG re-compression occurs.',
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={REORDER_PAGES_FAQS}
      technicalIntro="PDFQuick reorganizes PDF page order by remapping page references inside memory without altering underlying vector graphics or scanned imagery:"
    >
      <ReorderPagesTool />
    </ToolLayout>
  );
};
