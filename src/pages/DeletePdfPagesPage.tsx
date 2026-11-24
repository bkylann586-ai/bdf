import React, { useEffect } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { DeletePagesTool } from '../components/tools/DeletePagesTool';
import { getToolById } from '../lib/toolsCatalog';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';

const DELETE_PAGES_FAQS: FaqSchemaItem[] = [
  {
    question: 'How do I remove blank or unwanted pages from a PDF without Adobe Acrobat?',
    answer: 'Upload your PDF into the Delete PDF Pages tool, enter the page numbers or ranges you want removed (for example "1, 4-5"), check the live remaining-page preview, and download your clean pruned PDF directly in your browser.',
  },
  {
    question: 'Can I delete a cover page, trailing signature blank, or specific middle range?',
    answer: 'Yes. Quick-select buttons let you target the Cover Page (1), the Last Page, or Middle Pages in one click, or type any comma-separated combination such as "2, 7, 10-12".',
  },
  {
    question: 'What happens if I try to delete every page in the document?',
    answer: 'PDFQuick validates your selection against the total page count and prevents removing 100% of pages, because every valid PDF must retain at least 1 page.',
  },
  {
    question: 'Does removing pages keep formatting intact on US Letter and UK A4 filings?',
    answer: 'Yes. Only the excluded pages are omitted when copying kept page nodes into a fresh PDF catalog, so margins, tables, form fields, and text clarity on remaining pages stay identical to the original.',
  },
  {
    question: 'Is it safe to strip confidential salary or client exhibit pages here?',
    answer: 'Yes. Deleted pages are omitted inside local RAM on your device and never touch any external server. Neither the original PDF nor the removed pages are ever uploaded or logged.',
  },
];

export const DeletePdfPagesPage: React.FC = () => {
  const tool = getToolById('delete-pdf-pages')!;

  useEffect(() => {
    return injectFaqSchema(DELETE_PAGES_FAQS, { toolId: tool.id });
  }, [tool.id]);

  const howToSteps = [
    {
      step: '1',
      title: 'Load Your PDF File',
      description: 'Drop any multi-page PDF document (up to 250 MB) to inspect its total page count inside browser memory.',
    },
    {
      step: '2',
      title: 'Specify Pages to Delete',
      description: 'Type page numbers or ranges (like 1, 3-5) or click quick-select buttons while previewing how many pages remain.',
    },
    {
      step: '3',
      title: 'Save Clean PDF',
      description: 'Generate and download a fresh PDF containing only the kept pages without blank sheets or extra appendices.',
    },
  ];

  const technicalDetails = [
    {
      title: 'Clean Page Catalog Rebuild',
      content: 'Copies only the kept page references into a clean PDFDocument catalog so removed pages do not stay hidden inside the file.',
    },
    {
      title: 'Real-Time Remaining Preview',
      content: 'Parses range intervals before processing so you can verify the exact removed and remaining page counts upfront.',
    },
    {
      title: 'Lossless Font & Vector Retention',
      content: 'Retains original vector paths, searchable text layers, and embedded images on all kept pages.',
    },
    {
      title: '250 MB Safety Ceiling',
      content: 'Enforces browser memory guardrails cleanly and rejects password-locked PDFs with clear unlocking instructions.',
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={DELETE_PAGES_FAQS}
      technicalIntro="PDFQuick removes unwanted, blank, or sensitive pages by constructing a new pruned document catalog containing only the pages you choose to keep:"
    >
      <DeletePagesTool />
    </ToolLayout>
  );
};
