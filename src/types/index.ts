export type ToolId =
  | 'merge-pdf'
  | 'split-pdf'
  | 'compress-pdf'
  | 'images-to-pdf'
  | 'pdf-to-images'
  | 'rotate-pdf'
  | 'delete-pdf-pages'
  | 'reorder-pdf-pages'
  | 'add-page-numbers'
  | 'watermark-pdf'
  | 'ocr-pdf';

export type ToolCategory = 'organize' | 'optimize' | 'convert' | 'edit';

export interface ToolMeta {
  id: ToolId;
  name: string;
  shortDescription: string;
  tagline: string;
  iconName: string;
  path: string;
  category: ToolCategory;
  badge?: string;
  acceptTypes: string;
  supportsMultiple: boolean;
  metaTitle: string;
  metaDescription: string;
  schemaType: 'WebApplication' | 'SoftwareApplication';
  keywords: string[];
}

export interface ProcessingFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  pageCount?: number;
  previewUrl?: string;
  width?: number;
  height?: number;
  rotation?: number;
  error?: string;
}

export type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';

export interface ProcessingResult {
  blob: Blob;
  downloadName: string;
  fileSize: number;
  originalSize?: number;
  pageCount?: number;
  itemCount?: number;
  previewUrl?: string;
  message?: string;
}

export type SplitMode = 'range' | 'all' | 'chunk';

export interface SplitOptions {
  mode: SplitMode;
  pageRange: string; // e.g. "1-3, 5"
  chunkSize: number; // e.g. every 2 pages
}

export type CompressLevel = 'recommended' | 'extreme' | 'lossless';

export interface CompressOptions {
  level: CompressLevel;
}

export type PageSizeOption = 'a4' | 'letter' | 'fit';
export type PageOrientationOption = 'portrait' | 'landscape' | 'auto';
export type MarginOption = 'none' | 'small' | 'large';

export interface ImagesToPdfOptions {
  pageSize: PageSizeOption;
  orientation: PageOrientationOption;
  margin: MarginOption;
}

export type ImageFormatOption = 'image/png' | 'image/jpeg';

export interface PdfToImagesOptions {
  format: ImageFormatOption;
  scale: number; // 1.5, 2.0, 3.0
  quality: number; // 0.8 to 1.0 for jpeg
  pageSelection: 'all' | 'range';
  pageRange: string;
}

export type RotateAngle = 90 | 180 | 270;

export interface RotateOptions {
  angle: RotateAngle;
  pageSelection: 'all' | 'range';
  pageRange: string;
}

export interface DeletePagesOptions {
  pageRange: string;
}

export interface ReorderPagesOptions {
  pageOrder: number[]; // 1-based original page numbers in desired output order
}

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right';

export type PageNumberFormat = 'number' | 'page_n' | 'page_n_of_total';

export interface AddPageNumbersOptions {
  position: PageNumberPosition;
  format: PageNumberFormat;
  startNumber: number;
  skipFirstPage: boolean;
  fontSize: number;
}

export type WatermarkPosition = 'diagonal' | 'center' | 'tiled';
export type WatermarkColor = 'slate' | 'red' | 'blue';

export interface WatermarkOptions {
  text: string;
  opacity: number; // 0.15 to 0.65
  fontSize: number; // 28 to 64
  position: WatermarkPosition;
  color: WatermarkColor;
  pageSelection: 'all' | 'range';
  pageRange: string;
}

export type BankingServiceStatus = 'active' | 'planned';

export interface BankingServiceMeta {
  id: string;
  number: number;
  name: string;
  shortDescription: string;
  status: BankingServiceStatus;
  primaryPath: string;
  linkedToolIds: ToolId[];
  secondaryLinks?: { label: string; path: string }[];
  usUseCases: string[];
  keywords: string[];
}

export type UsBankSlug = 'chase' | 'bank-of-america' | 'wells-fargo' | 'citi' | 'us-bank';

export interface UsBankGuide {
  slug: UsBankSlug;
  path: string;
  bankName: string;
  legalEntityNote: string;
  headline: string;
  metaTitle: string;
  metaDescription: string;
  overview: string;
  commonStatementTasks: string[];
  recommendedWorkflows: {
    title: string;
    description: string;
    toolPath: string;
    toolLabel: string;
  }[];
  viewerUnlockTip: string;
  faqs: { question: string; answer: string }[];
}

export type FinancialTemplateId =
  | 'personal-financial-information'
  | 'income-and-expense-statement'
  | 'monthly-budget'
  | 'business-financial-information'
  | 'beneficiary-information';

export interface FinancialTemplateField {
  key: string;
  label: string;
  type: 'text' | 'currency' | 'number' | 'date' | 'select' | 'textarea' | 'percentage';
  required: boolean;
  examplePlaceholder: string;
  sensitivity: 'standard' | 'pii-caution';
  options?: string[];
  validationNote?: string;
}

export interface FinancialTemplateSection {
  id: string;
  title: string;
  description: string;
  fields: FinancialTemplateField[];
}

export interface FinancialTemplateMeta {
  id: FinancialTemplateId;
  name: string;
  shortSummary: string;
  targetAudience: string;
  paperStandard: string;
  recommendedCompanionTools: { label: string; path: string }[];
  sections: FinancialTemplateSection[];
  disclaimer: string;
}

export type OcrLanguageCode =
  | 'eng'
  | 'ara'
  | 'spa'
  | 'fra'
  | 'deu'
  | 'eng+ara'
  | 'eng+spa'
  | 'eng+fra';

export type OcrMode = 'hybrid' | 'force-ocr';

export interface OcrWordBox {
  text: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  confidence: number;
}

export interface OcrPageResult {
  pageNumber: number;
  source: 'ocr' | 'embedded-text';
  text: string;
  confidence: number | null;
  wordCount: number;
  characterCount: number;
  words: OcrWordBox[];
  widthPt: number;
  heightPt: number;
}

export interface OcrPdfOptions {
  language: OcrLanguageCode;
  mode: OcrMode;
  scale: number; // 1.5 or 2.0
  pageSelection: 'all' | 'range';
  pageRange: string;
}

export interface OcrPdfResult {
  pages: OcrPageResult[];
  combinedText: string;
  searchablePdfBlob: Blob;
  searchablePdfFilename: string;
  textFilename: string;
  totalProcessedPages: number;
  ocrPageCount: number;
  embeddedTextPageCount: number;
  averageConfidence: number | null;
  totalWords: number;
  totalCharacters: number;
  durationMs: number;
}

