import { PDFDict, PDFName } from 'pdf-lib';
import {
  EditPdfMetadataOptions,
  PdfMetadataValues,
  ProcessingFile,
  ProcessingResult,
} from '../types';
import { loadUnencryptedPdf, readFileAsArrayBuffer } from './pdfUtils';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Format a Date instance for an HTML <input type="datetime-local"> value (YYYY-MM-DDTHH:mm)
 * in the user's local timezone.
 */
export function formatDateTimeLocalInput(date?: Date | null): string {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  if (year < 1900 || year > 2999) {
    return '';
  }
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parse a YYYY-MM-DDTHH:mm (or ISO) string into a valid Date, or return null if empty.
 */
export function parseDateTimeInput(value: string, fieldLabel: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const localMatch = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (localMatch) {
    const year = Number(localMatch[1]);
    const month = Number(localMatch[2]) - 1;
    const day = Number(localMatch[3]);
    const hour = Number(localMatch[4]);
    const minute = Number(localMatch[5]);
    const second = localMatch[6] ? Number(localMatch[6]) : 0;
    const parsed = new Date(year, month, day, hour, minute, second);
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month ||
      parsed.getDate() !== day
    ) {
      throw new Error(`Invalid ${fieldLabel}: please enter a valid calendar date and time.`);
    }
    return parsed;
  }

  const fallback = new Date(trimmed);
  if (Number.isNaN(fallback.getTime())) {
    throw new Error(`Invalid ${fieldLabel}: please enter a valid date and time.`);
  }
  return fallback;
}

function getInfoDictionary(doc: Awaited<ReturnType<typeof loadUnencryptedPdf>>): PDFDict | undefined {
  const infoRef = doc.context.trailerInfo.Info;
  if (!infoRef) return undefined;
  return doc.context.lookupMaybe(infoRef, PDFDict);
}

/**
 * Read current Info dictionary metadata and XMP presence from an unencrypted PDF file.
 */
export async function readPdfMetadata(file: File): Promise<PdfMetadataValues> {
  const buffer = await readFileAsArrayBuffer(file);
  const doc = await loadUnencryptedPdf(buffer, { updateMetadata: false });

  let title = '';
  let author = '';
  let subject = '';
  let keywords = '';
  let creator = '';
  let producer = '';
  let creationDate = '';
  let modificationDate = '';

  try {
    title = doc.getTitle() ?? '';
  } catch {
    title = '';
  }
  try {
    author = doc.getAuthor() ?? '';
  } catch {
    author = '';
  }
  try {
    subject = doc.getSubject() ?? '';
  } catch {
    subject = '';
  }
  try {
    keywords = doc.getKeywords() ?? '';
  } catch {
    keywords = '';
  }
  try {
    creator = doc.getCreator() ?? '';
  } catch {
    creator = '';
  }
  try {
    producer = doc.getProducer() ?? '';
  } catch {
    producer = '';
  }
  try {
    creationDate = formatDateTimeLocalInput(doc.getCreationDate());
  } catch {
    creationDate = '';
  }
  try {
    modificationDate = formatDateTimeLocalInput(doc.getModificationDate());
  } catch {
    modificationDate = '';
  }

  const hasXmpStream = doc.catalog.has(PDFName.of('Metadata'));
  const pageCount = doc.getPageCount();

  return {
    title,
    author,
    subject,
    keywords,
    creator,
    producer,
    creationDate,
    modificationDate,
    hasXmpStream,
    pageCount,
  };
}

/**
 * Update PDF Info dictionary metadata (Title, Author, Creation Date, and optional properties)
 * locally inside the browser using pdf-lib.
 */
export async function updatePdfMetadata(
  fileItem: ProcessingFile,
  options: EditPdfMetadataOptions,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<ProcessingResult> {
  onProgress?.(1, 3, 'Reading PDF structure and existing metadata...');
  const buffer = await readFileAsArrayBuffer(fileItem.file);
  const doc = await loadUnencryptedPdf(buffer, { updateMetadata: false });

  onProgress?.(2, 3, 'Writing updated Title, Author, and date properties...');

  const parsedCreationDate = parseDateTimeInput(options.creationDate, 'Creation Date');
  const parsedModificationDate = options.updateModificationToNow
    ? new Date()
    : parseDateTimeInput(options.modificationDate, 'Modification Date');

  const trimmedTitle = options.title.trim();
  const trimmedAuthor = options.author.trim();
  const trimmedSubject = options.subject.trim();
  const trimmedCreator = options.creator.trim();
  const trimmedProducer = options.producer.trim();
  const keywordList = options.keywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  if (trimmedTitle) {
    doc.setTitle(trimmedTitle, { showInWindowTitleBar: options.showTitleInWindowBar });
  } else {
    getInfoDictionary(doc)?.delete(PDFName.of('Title'));
    if (options.showTitleInWindowBar) {
      const prefs = doc.catalog.lookupMaybe(PDFName.of('ViewerPreferences'), PDFDict);
      prefs?.delete(PDFName.of('DisplayDocTitle'));
    }
  }

  if (trimmedAuthor) {
    doc.setAuthor(trimmedAuthor);
  } else {
    getInfoDictionary(doc)?.delete(PDFName.of('Author'));
  }

  if (trimmedSubject) {
    doc.setSubject(trimmedSubject);
  } else {
    getInfoDictionary(doc)?.delete(PDFName.of('Subject'));
  }

  if (keywordList.length > 0) {
    doc.setKeywords(keywordList);
  } else {
    getInfoDictionary(doc)?.delete(PDFName.of('Keywords'));
  }

  if (trimmedCreator) {
    doc.setCreator(trimmedCreator);
  } else {
    getInfoDictionary(doc)?.delete(PDFName.of('Creator'));
  }

  if (trimmedProducer) {
    doc.setProducer(trimmedProducer);
  } else {
    getInfoDictionary(doc)?.delete(PDFName.of('Producer'));
  }

  if (parsedCreationDate) {
    doc.setCreationDate(parsedCreationDate);
  } else {
    getInfoDictionary(doc)?.delete(PDFName.of('CreationDate'));
  }

  if (parsedModificationDate) {
    doc.setModificationDate(parsedModificationDate);
  } else {
    getInfoDictionary(doc)?.delete(PDFName.of('ModDate'));
  }

  let removedXmp = false;
  if (options.stripXmpMetadata && doc.catalog.has(PDFName.of('Metadata'))) {
    doc.catalog.delete(PDFName.of('Metadata'));
    removedXmp = true;
  }

  onProgress?.(3, 3, 'Serializing updated PDF document...');
  const updatedBytes = await doc.save();
  const blob = new Blob([updatedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const baseName = fileItem.name.replace(/\.pdf$/i, '') || 'document';
  const pageCount = doc.getPageCount();

  const updatedFields: string[] = [];
  if (trimmedTitle) updatedFields.push('Title');
  if (trimmedAuthor) updatedFields.push('Author');
  if (parsedCreationDate) updatedFields.push('Creation Date');
  if (trimmedSubject) updatedFields.push('Subject');
  if (keywordList.length > 0) updatedFields.push('Keywords');

  const summary =
    updatedFields.length > 0
      ? `Updated ${updatedFields.join(', ')}${removedXmp ? ' and removed cached XMP XML metadata' : ''}.`
      : `Cleared PDF Info metadata fields${removedXmp ? ' and removed embedded XMP XML stream' : ''}.`;

  return {
    blob,
    downloadName: `${baseName}_metadata.pdf`,
    fileSize: blob.size,
    originalSize: fileItem.size,
    pageCount,
    message: summary,
  };
}
