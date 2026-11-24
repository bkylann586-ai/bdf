import React, { useEffect } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { ImagesToPdfTool } from '../components/tools/ImagesToPdfTool';
import { getToolById } from '../lib/toolsCatalog';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';

const IMAGES_TO_PDF_FAQS: FaqSchemaItem[] = [
  {
    question: 'Can I mix JPG and PNG files in the same PDF?',
    answer: 'Yes! PDFQuick effortlessly combines JPG, JPEG, PNG, and WebP files into a unified multi-page document in any order you choose.',
  },
  {
    question: 'What is the "Fit to Image" page size option?',
    answer: '"Fit to Image" creates each PDF page to match the exact pixel dimensions and aspect ratio of that specific image, avoiding white borders entirely.',
  },
  {
    question: 'Can I reorder the images before converting?',
    answer: 'Yes, use the left and right arrow buttons on each image card in the preview grid to place pages in your desired sequence.',
  },
  {
    question: 'Are there limits on image resolution?',
    answer: 'Standard smartphone and digital camera photos process reliably on modern browsers. When converting many high-resolution photos at once, memory consumption increases accordingly.',
  },
  {
    question: 'Can I choose between A4 and US Letter page sizes?',
    answer: 'Yes! You can select ISO A4, ANSI US Letter, or "Fit to Image" dimensions, with customizable margin options (None, Small, or Large).',
  },
];

export const ImagesToPdfPage: React.FC = () => {
  const tool = getToolById('images-to-pdf')!;

  useEffect(() => {
    return injectFaqSchema(IMAGES_TO_PDF_FAQS, { toolId: tool.id });
  }, [tool.id]);

  const howToSteps = [
    {
      step: '1',
      title: 'Select Images',
      description: 'Upload JPG, JPEG, PNG, or WebP images from your phone, scanner, or desktop.',
    },
    {
      step: '2',
      title: 'Arrange & Configure',
      description: 'Use the arrow buttons on each thumbnail to reorder pages. Choose page size (A4, US Letter, or Fit), orientation, and margins.',
    },
    {
      step: '3',
      title: 'Convert & Download',
      description: 'Click "Convert Images to PDF". Download your cleanly formatted multi-page PDF document.',
    },
  ];

  const technicalDetails = [
    {
      title: 'Aspect-Ratio Preserving Scaling',
      content: 'Images are automatically scaled to fit within the designated page boundaries without stretching, distortion, or pixel cropping.',
    },
    {
      title: 'Native JPEG & PNG Embedding',
      content: 'Standard JPEG files are embedded as raw discrete streams without recompression artifacts, preserving camera photo sharpness.',
    },
    {
      title: 'Color Profile Correction',
      content: 'Non-standard color spaces and WebP graphics are sanitized using an off-screen HTML5 canvas buffer with full alpha-channel support.',
    },
    {
      title: 'Configurable Page Geometry',
      content: 'Supports standardized ISO A4 (595.28 × 841.89 pt), ANSI US Letter (612 × 792 pt), or native "Fit to Image" dimensions with custom margins.',
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={IMAGES_TO_PDF_FAQS}
      technicalIntro="PDFQuick converts raster pictures into standardized PDF page descriptions by embedding binary image payloads directly as XObject image dictionaries with precise coordinate transformations:"
    >
      <ImagesToPdfTool />
    </ToolLayout>
  );
};
