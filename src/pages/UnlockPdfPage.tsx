import React, { useEffect } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { UnlockPdfTool } from '../components/tools/UnlockPdfTool';
import { getToolById } from '../lib/toolsCatalog';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';

const UNLOCK_PDF_FAQS: FaqSchemaItem[] = [
  {
    question: 'Does Unlock PDF upload my password or encrypted document to a server?',
    answer:
      'No. Unlock PDF runs 100% locally inside your web browser using a client-side qpdf WebAssembly worker. Both your password and encrypted PDF stay strictly in your device memory with zero server uploads or logging.',
  },
  {
    question: 'Can this tool unlock a PDF if I do not know the password?',
    answer:
      'No. If a PDF is encrypted with an open (user) password, you must provide the correct user or owner password to derive the decryption keys. PDFQuick does not perform brute-force password cracking. However, if a PDF only has owner permission restrictions (such as disabled printing or copying) without an open password, PDFQuick can remove those restrictions immediately.',
  },
  {
    question: 'Which PDF encryption standards are supported?',
    answer:
      'PDFQuick supports all standard PDF encryption revisions, including RC4 40-bit, RC4 128-bit, AES-128 (PDF 1.6+), and AES-256 (PDF 2.0 / ISO 32000-2), as well as Unicode passwords.',
  },
  {
    question: 'Will unlocking my PDF reduce quality or remove selectable text?',
    answer:
      'No. Decryption operates losslessly at the PDF object and stream level without rasterizing pages. Vector fonts, hyperlinks, form fields, annotations, and original image resolution remain completely intact.',
  },
  {
    question: 'What can I do after removing the password from my PDF?',
    answer:
      'Once unlocked, you can save the password-free PDF directly or open it in any other PDFQuick tool—such as Merge PDF, Compress PDF, Edit PDF Metadata, Rotate PDF, or Watermark PDF.',
  },
];

export const UnlockPdfPage: React.FC = () => {
  const tool = getToolById('unlock-pdf')!;

  useEffect(() => {
    return injectFaqSchema(UNLOCK_PDF_FAQS, { toolId: tool.id });
  }, [tool.id]);

  const howToSteps = [
    {
      step: '1',
      title: 'Select or Drop Encrypted PDF',
      description:
        'Choose or drag-and-drop your password-protected PDF (or load the built-in AES-256 sample). PDFQuick inspects encryption status locally in your browser.',
    },
    {
      step: '2',
      title: 'Enter the Document Password',
      description:
        'Type the PDF open password or owner password (if only printing/editing restrictions apply, you can unlock directly without typing a password).',
    },
    {
      step: '3',
      title: 'Download Unlocked PDF',
      description:
        'Click Unlock PDF to decrypt streams losslessly inside browser WebAssembly memory and download a clean, unrestricted PDF immediately.',
    },
  ];

  const technicalDetails = [
    {
      title: 'WebAssembly qpdf Decryption Engine',
      content:
        'Executes qpdf compiled to WebAssembly inside an isolated browser Web Worker to verify keys and decrypt RC4-40, RC4-128, AES-128, and AES-256 PDF streams.',
    },
    {
      title: '100% Lossless Vector & Text Preservation',
      content:
        'Decrypts content and object streams without re-rendering pages, keeping selectable text, embedded fonts, bookmarks, and graphics identical to the original.',
    },
    {
      title: 'User & Owner Password Handling',
      content:
        'Unlocks user-locked PDFs when supplied with the valid open or owner password, and automatically detects owner-only permission locks.',
    },
    {
      title: 'Zero-Upload Privacy & Memory Cleanup',
      content:
        'Passwords are held only during in-memory decryption, cleared immediately after export, and never transmitted to any remote endpoint.',
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={UNLOCK_PDF_FAQS}
      technicalIntro="PDFQuick removes password protection and usage restrictions strictly inside browser memory using WebAssembly:"
    >
      <UnlockPdfTool />
    </ToolLayout>
  );
};
