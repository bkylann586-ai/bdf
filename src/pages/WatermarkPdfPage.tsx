import React, { useEffect } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { WatermarkPdfTool } from '../components/tools/WatermarkPdfTool';
import { getToolById } from '../lib/toolsCatalog';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';

const WATERMARK_PDF_FAQS: FaqSchemaItem[] = [
  {
    question: 'What presets and layout options can I use to watermark a PDF?',
    answer: 'Use one-click presets like CONFIDENTIAL, DRAFT, COPY, or DO NOT DISTRIBUTE—or type any custom phrase up to 80 characters. Choose Diagonal 45°, Centered Horizontal, or a Tiled 2x3 repeating grid with custom opacity, size, and color.',
  },
  {
    question: 'Will long watermark phrases get cut off at page edges?',
    answer: 'No. PDFQuick measures text width against your chosen page CropBox span and automatically scales oversized phrases so diagonal or centered stamps fit cleanly within margins.',
  },
  {
    question: 'Can I apply a watermark to just the first few pages or specific exhibits?',
    answer: 'Yes. Switch between All Pages and Specific Page Range (for example "1-3, 8") so title pages or drafts receive stamps while finalized signature sheets stay clean.',
  },
  {
    question: 'Does text stay readable underneath the watermark?',
    answer: 'Yes. Adjustable transparency (from 15% to 65% opacity) keeps underlying financial figures, clauses, and CAD diagrams clearly legible behind your watermark.',
  },
  {
    question: 'Are proprietary proposals or NDAs sent to a cloud API during stamping?',
    answer: 'Never. All font embedding, transparency alpha compositing, and PDF serialization happen inside your local browser RAM with zero server uploads.',
  },
];

export const WatermarkPdfPage: React.FC = () => {
  const tool = getToolById('watermark-pdf')!;

  useEffect(() => {
    return injectFaqSchema(WATERMARK_PDF_FAQS, { toolId: tool.id });
  }, [tool.id]);

  const howToSteps = [
    {
      step: '1',
      title: 'Load Document',
      description: 'Select an unencrypted PDF (up to 250 MB) from your device or test immediately with our sample contract.',
    },
    {
      step: '2',
      title: 'Enter Text & Appearance',
      description: 'Pick a preset or type your custom watermark label, then set diagonal, centered, or tiled layout, ink color, size, and opacity.',
    },
    {
      step: '3',
      title: 'Stamp & Download',
      description: 'Apply vector HelveticaBold stamps across all pages or selected ranges and save your watermarked PDF locally.',
    },
  ];

  const technicalDetails = [
    {
      title: 'Vector Alpha Compositing',
      content: 'Draws semi-transparent HelveticaBold vector text directly over PDF page content without rasterizing crisp typography.',
    },
    {
      title: 'Auto-Fit Span Protection',
      content: 'Measures text metrics against each page diagonal or horizontal width and scales long strings so text stays inside margins.',
    },
    {
      title: 'Three Structural Layouts',
      content: 'Supports single 45° diagonal stamps, centered horizontal overlays, and repeating 2x3 tiled grids across US Letter and A4 sheets.',
    },
    {
      title: 'Selective Page Targeting',
      content: 'Stamp entire packets or limit watermarks strictly to draft sections using validated page interval syntax.',
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={WATERMARK_PDF_FAQS}
      technicalIntro="PDFQuick stamps semi-transparent vector text overlays across single or multi-page documents strictly inside browser memory:"
    >
      <WatermarkPdfTool />
    </ToolLayout>
  );
};
