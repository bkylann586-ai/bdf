import { ToolCategory, ToolMeta } from '../types';

export const TOOLS: ToolMeta[] = [
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    shortDescription: 'Combine multiple PDF documents into a single organized file in your chosen order.',
    tagline: 'Combine multiple PDF files into one clean document quickly and privately.',
    iconName: 'Layers',
    path: '/merge-pdf',
    category: 'organize',
    acceptTypes: 'application/pdf,.pdf',
    supportsMultiple: true,
    metaTitle: 'Merge PDF – Combine Multiple PDF Files Online | PDFQuick',
    metaDescription: 'Merge PDF files into a single document directly in your web browser. Drag to reorder pages and files. Client-side processing with no document uploads.',
    schemaType: 'WebApplication',
    keywords: ['merge pdf', 'combine pdf', 'join pdf files', 'append pdf', 'us letter', 'uk a4', 'legal packet', 'contract exhibits'],
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    shortDescription: 'Extract specific page ranges, split into single pages, or divide documents into page groups.',
    tagline: 'Extract specific pages or separate a document into individual PDF files.',
    iconName: 'Scissors',
    path: '/split-pdf',
    category: 'organize',
    acceptTypes: 'application/pdf,.pdf',
    supportsMultiple: false,
    metaTitle: 'Split PDF – Extract Pages or Separate PDF Files Online | PDFQuick',
    metaDescription: 'Extract specific page ranges or split pages into separate PDF files. Download as individual files or a ZIP archive. Processed in your browser.',
    schemaType: 'WebApplication',
    keywords: ['split pdf', 'extract pages', 'separate pdf', 'burst pdf', 'page range', 'zip archive', 'cut pdf'],
  },
  {
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    shortDescription: 'Permanently rotate upside-down or sideways PDF pages by 90°, 180°, or 270° in your browser.',
    tagline: 'Fix sideways scans or upside-down PDF pages permanently without cloud uploads.',
    iconName: 'RotateCw',
    path: '/rotate-pdf',
    category: 'organize',
    acceptTypes: 'application/pdf,.pdf',
    supportsMultiple: false,
    metaTitle: 'Rotate PDF – Permanently Turn PDF Pages Online | PDFQuick',
    metaDescription: 'Rotate all PDF pages or specific page ranges by 90, 180, or 270 degrees directly in your browser. Saves permanent PDF orientation with zero file uploads.',
    schemaType: 'WebApplication',
    keywords: ['rotate pdf', 'turn pdf pages', 'fix upside down pdf', 'landscape to portrait', 'rotate scanned pdf', 'permanent rotation', '90 degrees'],
  },
  {
    id: 'delete-pdf-pages',
    name: 'Delete PDF Pages',
    shortDescription: 'Remove unwanted, blank, or confidential pages from any PDF document in seconds.',
    tagline: 'Remove specific pages or ranges from a PDF cleanly inside browser memory.',
    iconName: 'FileMinus',
    path: '/delete-pdf-pages',
    category: 'organize',
    acceptTypes: 'application/pdf,.pdf',
    supportsMultiple: false,
    metaTitle: 'Delete PDF Pages – Remove Pages from PDF Free | PDFQuick',
    metaDescription: 'Delete unwanted or blank pages from PDF documents privately in your browser. Specify page numbers or ranges and download a clean PDF immediately.',
    schemaType: 'WebApplication',
    keywords: ['delete pdf pages', 'remove pages from pdf', 'remove blank page', 'strip cover page', 'trim pdf', 'redact page'],
  },
  {
    id: 'reorder-pdf-pages',
    name: 'Reorder PDF Pages',
    shortDescription: 'Rearrange page sequence, reverse duplex-scanned documents, or fix out-of-order PDFs.',
    tagline: 'Sort, swap, or reverse PDF page order losslessly without re-uploading files.',
    iconName: 'ArrowUpDown',
    path: '/reorder-pdf-pages',
    category: 'organize',
    acceptTypes: 'application/pdf,.pdf',
    supportsMultiple: false,
    metaTitle: 'Reorder PDF Pages – Rearrange & Sort PDF Online | PDFQuick',
    metaDescription: 'Rearrange PDF pages in any order or reverse scanned page sequences directly in your web browser. Lossless client-side PDF page organizer.',
    schemaType: 'WebApplication',
    keywords: ['reorder pdf pages', 'rearrange pdf', 'sort pdf pages', 'reverse pdf order', 'duplex scan order', 'move pages', 'organize pdf'],
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    shortDescription: 'Optimize PDF file size in your browser with transparent before-and-after size comparisons.',
    tagline: 'Reduce PDF file size locally without uploading confidential papers to cloud servers.',
    iconName: 'Minimize2',
    path: '/compress-pdf',
    category: 'optimize',
    acceptTypes: 'application/pdf,.pdf',
    supportsMultiple: false,
    metaTitle: 'Compress PDF – Optimize PDF Size in Your Browser | PDFQuick',
    metaDescription: 'Optimize PDF file size directly in your browser. Real optimization with clear size reports. No file uploads and no artificial compression claims.',
    schemaType: 'WebApplication',
    keywords: ['compress pdf', 'shrink pdf', 'reduce pdf size', 'optimize pdf', 'email attachment limit', 'portal upload size', 'lossless compress'],
  },
  {
    id: 'images-to-pdf',
    name: 'Images to PDF',
    shortDescription: 'Convert JPG, JPEG, and PNG pictures into a single clean PDF with customizable page sizes.',
    tagline: 'Turn image files into clean, shareable PDF documents with custom page sizing.',
    iconName: 'Image',
    path: '/images-to-pdf',
    category: 'convert',
    acceptTypes: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
    supportsMultiple: true,
    metaTitle: 'Images to PDF – Convert JPG & PNG to PDF Online | PDFQuick',
    metaDescription: 'Convert photos and graphics into a PDF document. Choose page dimensions (A4, US Letter, Fit to Image), orientation, and margins directly in browser.',
    schemaType: 'WebApplication',
    keywords: ['images to pdf', 'jpg to pdf', 'png to pdf', 'webp to pdf', 'photos to pdf', 'us letter', 'uk a4', 'receipts pdf'],
  },
  {
    id: 'pdf-to-images',
    name: 'PDF to Images',
    shortDescription: 'Render PDF pages into crisp JPG or PNG images and download individually or in a ZIP archive.',
    tagline: 'Extract each PDF page as a high-resolution PNG or JPEG picture with one-click ZIP download.',
    iconName: 'FileImage',
    path: '/pdf-to-images',
    category: 'convert',
    acceptTypes: 'application/pdf,.pdf',
    supportsMultiple: false,
    metaTitle: 'PDF to Images – Convert PDF Pages to PNG or JPG | PDFQuick',
    metaDescription: 'Render PDF pages to high-resolution PNG or JPEG images. Batch download all pages as a ZIP file or save single pages. In-browser client-side processing.',
    schemaType: 'WebApplication',
    keywords: ['pdf to images', 'pdf to png', 'pdf to jpg', 'convert pdf to picture', 'render pdf dpi', 'slides to images'],
  },
  {
    id: 'add-page-numbers',
    name: 'Add Page Numbers',
    shortDescription: 'Stamp clean sequential page numbers onto US Letter, UK A4, or legal PDF documents.',
    tagline: 'Insert customizable header or footer page numbers across your PDF with cover-page skip.',
    iconName: 'Hash',
    path: '/add-page-numbers',
    category: 'edit',
    acceptTypes: 'application/pdf,.pdf',
    supportsMultiple: false,
    metaTitle: 'Add Page Numbers to PDF – Number PDF Pages Online | PDFQuick',
    metaDescription: 'Add formatted page numbers (1, Page 1, Page 1 of N) to PDF headers or footers in your browser. Supports US Letter, A4, and skip-cover numbering.',
    schemaType: 'WebApplication',
    keywords: ['add page numbers', 'number pdf pages', 'pdf footer pagination', 'legal exhibit numbering', 'court brief pagination', 'skip cover page', 'page x of y'],
  },
  {
    id: 'watermark-pdf',
    name: 'Watermark PDF',
    shortDescription: 'Apply custom confidential, draft, or copyright text watermarks directly inside your browser.',
    tagline: 'Stamp diagonal, centered, or tiled text watermarks with custom opacity and color.',
    iconName: 'Stamp',
    path: '/watermark-pdf',
    category: 'edit',
    acceptTypes: 'application/pdf,.pdf',
    supportsMultiple: false,
    metaTitle: 'Watermark PDF – Add Custom Text Stamp to PDF | PDFQuick',
    metaDescription: 'Add CONFIDENTIAL, DRAFT, or custom text watermarks to PDF documents in your browser. Adjust opacity, size, color, and layout with zero server uploads.',
    schemaType: 'WebApplication',
    keywords: ['watermark pdf', 'stamp pdf', 'confidential watermark', 'draft stamp', 'copyright pdf', 'do not distribute', 'legal watermark'],
  },
  {
    id: 'ocr-pdf',
    name: 'OCR PDF',
    shortDescription: 'Recognize text in scanned PDFs using lightweight in-browser Tesseract.js and export searchable PDF or TXT.',
    tagline: 'Extract selectable text from scanned PDFs and receipts locally with zero server uploads.',
    iconName: 'ScanText',
    path: '/ocr-pdf',
    category: 'convert',
    acceptTypes: 'application/pdf,.pdf',
    supportsMultiple: false,
    metaTitle: 'OCR PDF – Extract Text & Make Scanned PDFs Searchable | PDFQuick',
    metaDescription: 'Perform optical character recognition (OCR) on scanned PDFs directly in your browser using Tesseract.js. Export searchable PDFs or plain text privately.',
    schemaType: 'WebApplication',
    keywords: ['ocr pdf', 'scanned pdf to text', 'searchable pdf', 'tesseract ocr', 'extract text from scan', 'arabic ocr pdf', 'receipt ocr'],
  },
];

export const getToolById = (id: string): ToolMeta | undefined => {
  return TOOLS.find((tool) => tool.id === id);
};

export function searchTools(
  query: string,
  category: ToolCategory | 'all' = 'all'
): ToolMeta[] {
  const normalized = query.trim().toLowerCase();

  return TOOLS.filter((tool) => {
    if (category !== 'all' && tool.category !== category) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    const haystack = [
      tool.name,
      tool.shortDescription,
      tool.tagline,
      tool.category,
      ...tool.keywords,
    ]
      .join(' ')
      .toLowerCase();

    return normalized
      .split(/\s+/)
      .every((term) => haystack.includes(term));
  });
}
