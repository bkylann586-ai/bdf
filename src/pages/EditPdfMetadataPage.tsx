import React, { useEffect } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { EditPdfMetadataTool } from '../components/tools/EditPdfMetadataTool';
import { getToolById } from '../lib/toolsCatalog';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';

const EDIT_METADATA_FAQS: FaqSchemaItem[] = [
  {
    question: 'Does Edit PDF Metadata upload my PDF to inspect or change properties?',
    answer:
      'No. Your PDF is parsed and rewritten strictly inside your browser memory using pdf-lib. Existing metadata is read locally, updated in RAM, and downloaded directly to your device without server transmission.',
  },
  {
    question: 'Which PDF metadata fields can I change or clear?',
    answer:
      'You can inspect, edit, or clear the Document Title, Author, and Creation Date, as well as optional properties including Subject, Keywords, Creator Application, PDF Producer, and Modification Date.',
  },
  {
    question: 'Why does PDFQuick recommend removing the embedded XMP metadata stream?',
    answer:
      'Many desktop applications embed a separate XML XMP stream alongside the standard PDF Info dictionary. Removing stale XMP packets ensures PDF viewers, macOS Finder, Windows Explorer, and Adobe Acrobat consistently display your updated Title, Author, and Creation Date.',
  },
  {
    question: 'Does editing metadata alter page text, images, or layout?',
    answer:
      'No. PDFQuick updates the document Info dictionary and catalog preferences without re-rendering pages, so vector fonts, embedded graphics, links, and page dimensions remain completely intact.',
  },
  {
    question: 'Can I edit metadata on password-protected or encrypted PDFs?',
    answer:
      'No. Encrypted PDFs require decryption keys to rewrite document dictionaries safely. Remove any password protection before uploading to edit PDF properties.',
  },
];

export const EditPdfMetadataPage: React.FC = () => {
  const tool = getToolById('edit-pdf-metadata')!;

  useEffect(() => {
    return injectFaqSchema(EDIT_METADATA_FAQS, { toolId: tool.id });
  }, [tool.id]);

  const howToSteps = [
    {
      step: '1',
      title: 'Load Your PDF Document',
      description:
        'Select or drop any unencrypted PDF file (or load the built-in sample) to automatically read its current Title, Author, Creation Date, and catalog metadata.',
    },
    {
      step: '2',
      title: 'Edit or Clear Properties',
      description:
        'Update the Document Title, Author, Creation Date, or open Additional Properties to adjust Subject, Keywords, Creator, Producer, and Modification Date.',
    },
    {
      step: '3',
      title: 'Save Updated PDF',
      description:
        'Click Save PDF Metadata to rewrite the PDF Info dictionary locally in your browser and download the updated document immediately.',
    },
  ];

  const technicalDetails = [
    {
      title: 'Non-Destructive Info Dictionary Rewriting',
      content:
        'Uses pdf-lib with updateMetadata disabled on load so only the Info properties and dates you explicitly set or clear are written into the serialized PDF.',
    },
    {
      title: 'ViewerPreferences DisplayDocTitle Support',
      content:
        'Optionally sets the PDF Catalog ViewerPreferences DisplayDocTitle flag so browsers and desktop readers display the document Title instead of the raw filename.',
    },
    {
      title: 'Optional XMP Catalog Stream Cleanup',
      content:
        'Detects and optionally strips the Catalog Metadata XMP XML stream so legacy viewers cannot fall back to outdated XML title, creator, or creation timestamps.',
    },
    {
      title: 'Strict Local-Only Execution & Encryption Check',
      content:
        'Rejects encrypted or password-protected PDFs before editing and runs 100% client-side in browser RAM with zero external API calls.',
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={EDIT_METADATA_FAQS}
      technicalIntro="PDFQuick inspects and updates PDF document metadata directly inside browser memory using pdf-lib:"
    >
      <EditPdfMetadataTool />
    </ToolLayout>
  );
};
