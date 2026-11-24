import React, { useEffect } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { MergePdfTool } from '../components/tools/MergePdfTool';
import { getToolById } from '../lib/toolsCatalog';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';

const MERGE_PDF_FAQS: FaqSchemaItem[] = [
  {
    question: 'Is there a limit on how many PDF files I can merge?',
    answer: 'There is no artificial limit imposed by PDFQuick. Practical limits depend on your device memory. Merging 2 to 30 typical business PDFs runs smoothly on modern browsers.',
  },
  {
    question: 'Are my confidential documents uploaded to a remote server?',
    answer: 'No. Unlike traditional PDF services that upload your files to remote cloud buckets, PDFQuick processes every byte locally inside your web browser via client-side JavaScript and local memory buffers.',
  },
  {
    question: 'Will merging reduce the quality of my PDF text or diagrams?',
    answer: 'Not at all. The merge process is lossless; original page objects, vector lines, text layers, and fonts are copied exactly into the merged document.',
  },
  {
    question: 'Can I merge password-protected PDFs?',
    answer: 'Encrypted or password-locked PDFs cannot be read without the unlock password. Please remove any password protection before merging.',
  },
  {
    question: 'Can I reorder documents before merging?',
    answer: 'Yes! Use the up and down arrow controls on each file card to arrange your PDF documents in the exact order you want them merged.',
  },
];

export const MergePdfPage: React.FC = () => {
  const tool = getToolById('merge-pdf')!;

  useEffect(() => {
    return injectFaqSchema(MERGE_PDF_FAQS, { toolId: tool.id });
  }, [tool.id]);

  const howToSteps = [
    {
      step: '1',
      title: 'Select PDF Documents',
      description: 'Upload two or more PDF files from your computer or mobile device. Files are read directly in memory.',
    },
    {
      step: '2',
      title: 'Arrange Order',
      description: 'Use the arrow controls to organize the exact sequence in which you want the pages and files to appear.',
    },
    {
      step: '3',
      title: 'Merge & Download',
      description: 'Click "Merge PDFs Now". Your unified PDF is assembled in seconds and downloaded immediately.',
    },
  ];

  const technicalDetails = [
    {
      title: 'Client-Side Stream Merging',
      content: 'PDFQuick uses pdf-lib to copy native page dictionaries and streams directly between document catalogs without server round-trips.',
    },
    {
      title: 'Browser Memory Safeguards',
      content: 'Documents are processed within your browser sandbox. PDFQuick enforces a 250 MB limit per file and combined merge queue for reliable memory handling.',
    },
    {
      title: 'Form & Font Preservation',
      content: 'Embedded TrueType/OpenType fonts and vector paths are preserved verbatim, maintaining exact document typography and print fidelity.',
    },
    {
      title: 'Catalog & Cross-Reference Table Synthesis',
      content: 'When combining documents, PDFQuick synthesizes a unified trailer dictionary and recalculates indirect object byte offsets in an updated cross-reference (xref) table to guarantee strict compliance across Adobe Acrobat and mobile PDF readers.',
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={MERGE_PDF_FAQS}
      technicalIntro="PDFQuick merges PDF files by copying low-level indirect object streams and unifying separate page catalog trees into a single structured document directly in browser RAM:"
    >
      <MergePdfTool />
    </ToolLayout>
  );
};
