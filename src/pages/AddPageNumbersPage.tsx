import React, { useEffect } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { AddPageNumbersTool } from '../components/tools/AddPageNumbersTool';
import { getToolById } from '../lib/toolsCatalog';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';

const ADD_PAGE_NUMBERS_FAQS: FaqSchemaItem[] = [
  {
    question: 'Which page number formats and positions are supported?',
    answer: 'You can place numbers at Bottom Center, Bottom Right, Bottom Left, Top Center, or Top Right, formatted as "Page 1 of N", "Page 1", or plain digits ("1") using crisp Helvetica typography.',
  },
  {
    question: 'Can I skip numbering the cover page on US or UK business proposals?',
    answer: 'Yes. Enable "Skip cover page" to leave Page 1 blank while starting sequential numbering cleanly from Page 2 onward.',
  },
  {
    question: 'How does PDFQuick avoid cutting off numbers on US Letter, Legal, or A4 pages?',
    answer: 'Instead of assuming fixed coordinates, our engine reads each page CropBox dimensions and calculates proportional margins so numbers fit neatly inside both US Letter (8.5 x 11 in) and UK/ISO A4 sheets.',
  },
  {
    question: 'Can I start pagination at a custom number above 1 for multi-part exhibits?',
    answer: 'Yes. Adjust "Starting Page Number" to any integer starting value (such as 15 or 101) to continue numbering across split binders or court appendices.',
  },
  {
    question: 'Are contracts or legal filings uploaded when adding page numbers?',
    answer: 'No. PDFQuick embeds standard Helvetica glyphs and saves the paginated file locally in your browser without sending documents to any external server.',
  },
];

export const AddPageNumbersPage: React.FC = () => {
  const tool = getToolById('add-page-numbers')!;

  useEffect(() => {
    return injectFaqSchema(ADD_PAGE_NUMBERS_FAQS, { toolId: tool.id });
  }, [tool.id]);

  const howToSteps = [
    {
      step: '1',
      title: 'Upload Your PDF',
      description: 'Select any unencrypted PDF document (up to 250 MB), whether formatted for US Letter, Legal, or A4 printing.',
    },
    {
      step: '2',
      title: 'Customize Style & Margins',
      description: 'Pick header or footer position, label style (e.g. Page 1 of N), starting number, font size, and whether to skip Page 1.',
    },
    {
      step: '3',
      title: 'Download Paginated PDF',
      description: 'Stamp crisp vector page numbers onto every target page and download your print-ready PDF immediately.',
    },
  ];

  const technicalDetails = [
    {
      title: 'CropBox-Aware Placement',
      content: 'Measures every individual page CropBox width, height, and origin offsets so mixed-size packets align accurately.',
    },
    {
      title: 'Standard Type-1 Font Embedding',
      content: 'Embeds Standard Helvetica font metrics directly, adding clean searchable text labels with negligible byte overhead.',
    },
    {
      title: 'Flexible Cover & Exhibit Rules',
      content: 'Supports custom start integers and optional Page 1 cover skipping for reports, dissertations, and legal briefs.',
    },
    {
      title: 'Offline Memory Execution',
      content: 'Runs purely in JavaScript inside your browser tab, ideal for sensitive M&A binders, HR packets, and court filings.',
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={ADD_PAGE_NUMBERS_FAQS}
      technicalIntro="PDFQuick adds clean, print-ready header and footer pagination across US Letter, Legal, and ISO A4 documents using CropBox coordinate geometry:"
    >
      <AddPageNumbersTool />
    </ToolLayout>
  );
};
