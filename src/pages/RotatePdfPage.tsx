import React, { useEffect } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { RotatePdfTool } from '../components/tools/RotatePdfTool';
import { getToolById } from '../lib/toolsCatalog';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';

const ROTATE_PDF_FAQS: FaqSchemaItem[] = [
  {
    question: 'Does Rotate PDF permanently save the new page orientation?',
    answer: 'Yes. Unlike viewing rotation inside a browser PDF previewer, PDFQuick updates each target page dictionary Rotate metadata attribute inside the PDF structure and exports a newly saved PDF file that stays upright in Adobe Acrobat, macOS Preview, Windows Edge, and mobile viewers.',
  },
  {
    question: 'Can I rotate only specific sideways pages instead of the whole document?',
    answer: 'Yes. Choose "Specific Page Range" and enter individual page numbers or intervals such as "2, 4-6". Only those selected pages will turn by your chosen 90°, 180°, or 270° angle while portrait pages remain untouched.',
  },
  {
    question: 'Will rotating PDF pages reduce text sharpness or rasterize graphics?',
    answer: 'No. Page rotation modifies the page orientation flag inside the PDF catalog rather than re-encoding or screenshotting page artwork. Vector fonts, searchable text, CAD linework, and original embedded scans retain 100% of their fidelity.',
  },
  {
    question: 'Does this support both US Letter and UK A4 scanned contracts?',
    answer: 'Yes. PDFQuick preserves the native physical page dimensions (including 8.5 x 11 inch US Letter, Legal, and ISO A4 or A3 sheets) while swapping display orientation cleanly when pages are turned 90° or 270°.',
  },
  {
    question: 'Are tax forms, IDs, or legal exhibits uploaded to any server during rotation?',
    answer: 'Never. All PDF inspection and rotation happen strictly inside your local browser memory sandbox with zero cloud uploads, no account registration, and no server storage.',
  },
];

export const RotatePdfPage: React.FC = () => {
  const tool = getToolById('rotate-pdf')!;

  useEffect(() => {
    return injectFaqSchema(ROTATE_PDF_FAQS, { toolId: tool.id });
  }, [tool.id]);

  const howToSteps = [
    {
      step: '1',
      title: 'Load Your PDF Document',
      description: 'Select or drop an unencrypted PDF file (up to 250 MB). Page count is read locally in your browser without network upload.',
    },
    {
      step: '2',
      title: 'Pick Angle & Target Pages',
      description: 'Choose 90° clockwise, 180° upside down, or 270° counter-clockwise rotation for all pages or a custom page range.',
    },
    {
      step: '3',
      title: 'Download Permanently Fixed PDF',
      description: 'Click Rotate PDF Now to write updated page orientation headers and download your corrected document immediately.',
    },
  ];

  const technicalDetails = [
    {
      title: 'Lossless Dictionary Orientation',
      content: 'Updates the PDF /Rotate entry on target page objects in multiples of 90 degrees without re-compressing fonts or images.',
    },
    {
      title: 'Cumulative Relative Turning',
      content: 'Respects any existing page rotation angle stored in the source file and computes modulo-360 orientation accurately.',
    },
    {
      title: 'Selective Range Parsing',
      content: 'Supports single pages and closed intervals (e.g. "2, 5-8") with strict out-of-bounds validation before modifying any page.',
    },
    {
      title: 'Encrypted File Protection',
      content: 'Automatically inspects for PDF encryption dictionaries so password-protected files are flagged cleanly rather than corrupted.',
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={ROTATE_PDF_FAQS}
      technicalIntro="PDFQuick permanently rotates scanned forms, wide financial spreadsheets, and upside-down pages by modifying page orientation dictionaries in memory:"
    >
      <RotatePdfTool />
    </ToolLayout>
  );
};
