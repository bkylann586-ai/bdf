export const MAX_SAFE_BROWSER_BYTES = 250 * 1024 * 1024; // 250 MB

export type DetectedMagicFormat = 'pdf' | 'jpeg' | 'png' | 'webp' | 'empty' | 'unknown';

export interface FileValidationOptions {
  accept: string;
  multiple: boolean;
  existingTotalBytes?: number;
  maxTotalBytes?: number;
}

export interface FileValidationResult {
  validFiles: File[];
  errorMessage: string | null;
}

function formatLimitMb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function formatSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function readHeaderBytes(blob: Blob, maxBytes: number = 1024): Promise<Uint8Array> {
  const slice = blob.slice(0, Math.min(blob.size, maxBytes));
  if (typeof slice.arrayBuffer === 'function') {
    const buffer = await slice.arrayBuffer();
    return new Uint8Array(buffer);
  }
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      reject(new Error('FileReader is not available in this environment'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error('Failed to read file header bytes'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file header bytes'));
    reader.readAsArrayBuffer(slice);
  });
}

function startsWithPdfMagic(bytes: Uint8Array): boolean {
  // Check %PDF- (0x25 0x50 0x44 0x46 0x2D) at byte 0 or after optional UTF-8 BOM / leading ASCII whitespace only
  let offset = 0;
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    offset = 3;
  }
  while (
    offset < bytes.length &&
    (bytes[offset] === 0x20 || bytes[offset] === 0x09 || bytes[offset] === 0x0a || bytes[offset] === 0x0d)
  ) {
    offset++;
  }
  if (offset + 5 > bytes.length) return false;
  return (
    bytes[offset] === 0x25 && // %
    bytes[offset + 1] === 0x50 && // P
    bytes[offset + 2] === 0x44 && // D
    bytes[offset + 3] === 0x46 && // F
    bytes[offset + 4] === 0x2d // -
  );
}

function startsWithJpegMagic(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function startsWithPngMagic(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

function startsWithWebpMagic(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  );
}

/**
 * Inspect actual binary file signature (Magic Bytes) from the beginning of the Blob/File.
 */
export async function detectFileSignature(file: Blob): Promise<DetectedMagicFormat> {
  if (!file || file.size === 0) {
    return 'empty';
  }
  try {
    const bytes = await readHeaderBytes(file, 1024);
    if (bytes.length === 0) return 'empty';
    if (startsWithPdfMagic(bytes)) return 'pdf';
    if (startsWithJpegMagic(bytes)) return 'jpeg';
    if (startsWithPngMagic(bytes)) return 'png';
    if (startsWithWebpMagic(bytes)) return 'webp';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function getAllowedSignatureFormats(accept: string): Set<'pdf' | 'jpeg' | 'png' | 'webp'> {
  const allowed = new Set<'pdf' | 'jpeg' | 'png' | 'webp'>();
  const tokens = accept
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.length === 0) {
    allowed.add('pdf');
    allowed.add('jpeg');
    allowed.add('png');
    allowed.add('webp');
    return allowed;
  }

  for (const token of tokens) {
    if (token === '.pdf' || token === 'application/pdf') {
      allowed.add('pdf');
    } else if (token === '.jpg' || token === '.jpeg' || token === 'image/jpeg') {
      allowed.add('jpeg');
    } else if (token === '.png' || token === 'image/png') {
      allowed.add('png');
    } else if (token === '.webp' || token === 'image/webp') {
      allowed.add('webp');
    } else if (token === 'image/*') {
      allowed.add('jpeg');
      allowed.add('png');
      allowed.add('webp');
    }
  }
  return allowed;
}

function inferFormatFromExtension(fileName: string): 'pdf' | 'jpeg' | 'png' | 'webp' | null {
  const lower = (fileName || '').toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'jpeg';
  if (lower.endsWith('.png')) return 'png';
  if (lower.endsWith('.webp')) return 'webp';
  return null;
}

function inferFormatFromMime(mimeType: string): 'pdf' | 'jpeg' | 'png' | 'webp' | null {
  const lower = (mimeType || '').toLowerCase().trim();
  if (lower === 'application/pdf') return 'pdf';
  if (lower === 'image/jpeg' || lower === 'image/jpg') return 'jpeg';
  if (lower === 'image/png') return 'png';
  if (lower === 'image/webp') return 'webp';
  return null;
}

export function isFileAccepted(file: File, accept: string): boolean {
  const acceptedTokens = accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  if (acceptedTokens.length === 0) {
    return true;
  }

  const fileNameLower = (file.name || '').toLowerCase();
  const fileTypeLower = (file.type || '').toLowerCase();

  return acceptedTokens.some((token) => {
    if (token.startsWith('.')) {
      return fileNameLower.endsWith(token);
    }
    if (token.includes('/*')) {
      const [category] = token.split('/');
      return fileTypeLower.startsWith(`${category}/`);
    }
    return fileTypeLower === token;
  });
}

/**
 * Shared file validation enforcing Magic-Byte content signatures (%PDF-, JPEG, PNG, WebP),
 * accepted file types, 250 MB per-file cap, and 250 MB cumulative queue cap across all upload
 * inputs, Add More buttons, and drag-and-drop handlers.
 */
export async function validateSelectedFiles(
  incomingFiles: File[] | FileList | null,
  options: FileValidationOptions
): Promise<FileValidationResult> {
  if (!incomingFiles || incomingFiles.length === 0) {
    return { validFiles: [], errorMessage: null };
  }

  const maxBytes = options.maxTotalBytes ?? MAX_SAFE_BROWSER_BYTES;
  const existingBytes = Math.max(0, options.existingTotalBytes ?? 0);
  const filesArray = Array.from(incomingFiles);
  const candidates = options.multiple ? filesArray : [filesArray[0]];
  const allowedSignatures = getAllowedSignatureFormats(options.accept);

  const validFiles: File[] = [];
  const emptyFileNames: string[] = [];
  const invalidTypeNames: string[] = [];
  const invalidSignatureDetails: string[] = [];
  const oversizedNames: string[] = [];
  let cumulativeExceeded = false;
  let runningTotalBytes = existingBytes;

  for (const file of candidates) {
    const fileLabel = file.name || 'Unnamed file';

    if (file.size === 0) {
      emptyFileNames.push(fileLabel);
      continue;
    }

    if (file.size > maxBytes) {
      oversizedNames.push(`${fileLabel} (${formatSizeMb(file.size)})`);
      continue;
    }

    const declaredMimeFormat = inferFormatFromMime(file.type);
    const declaredExtFormat = inferFormatFromExtension(file.name);
    const hasSpecificAllowedCheck = isFileAccepted(file, options.accept);

    // Inspect binary Magic Bytes even if extension or MIME appears valid
    const actualSignature = await detectFileSignature(file);

    if (actualSignature === 'empty') {
      emptyFileNames.push(fileLabel);
      continue;
    }

    if (actualSignature === 'unknown') {
      invalidSignatureDetails.push(
        `"${fileLabel}" (unrecognized binary header — expected ${Array.from(allowedSignatures).join('/').toUpperCase()})`
      );
      continue;
    }

    if (!allowedSignatures.has(actualSignature)) {
      invalidSignatureDetails.push(
        `"${fileLabel}" (detected ${actualSignature.toUpperCase()} content; accepted: ${Array.from(allowedSignatures).join(', ').toUpperCase()})`
      );
      continue;
    }

    // Reject spoofed extension or conflicting explicit MIME type
    if (declaredExtFormat && declaredExtFormat !== actualSignature) {
      invalidSignatureDetails.push(
        `"${fileLabel}" (extension suggests ${declaredExtFormat.toUpperCase()}, but file signature is ${actualSignature.toUpperCase()})`
      );
      continue;
    }

    if (declaredMimeFormat && declaredMimeFormat !== actualSignature) {
      invalidSignatureDetails.push(
        `"${fileLabel}" (MIME type "${file.type}" mismatches actual ${actualSignature.toUpperCase()} content)`
      );
      continue;
    }

    if (!hasSpecificAllowedCheck && (file.type || declaredExtFormat)) {
      invalidTypeNames.push(fileLabel);
      continue;
    }

    if (options.multiple && runningTotalBytes + file.size > maxBytes) {
      cumulativeExceeded = true;
      continue;
    }

    runningTotalBytes += file.size;
    validFiles.push(file);
  }

  const errorParts: string[] = [];

  if (emptyFileNames.length > 0) {
    errorParts.push(`Empty file skipped (${emptyFileNames.slice(0, 3).join(', ')}).`);
  }

  if (invalidSignatureDetails.length > 0) {
    const shown = invalidSignatureDetails.slice(0, 2).join('; ');
    const more =
      invalidSignatureDetails.length > 2
        ? ` (+${invalidSignatureDetails.length - 2} more)`
        : '';
    errorParts.push(
      `Invalid or mismatched file content rejected: ${shown}${more}.`
    );
  }

  if (invalidTypeNames.length > 0) {
    const label = invalidTypeNames.slice(0, 3).join(', ');
    const more = invalidTypeNames.length > 3 ? ` (+${invalidTypeNames.length - 3} more)` : '';
    errorParts.push(
      `Unsupported file type skipped (${label}${more}). Accepted formats: ${options.accept.replace(/\./g, ' ').toUpperCase()}.`
    );
  }

  if (oversizedNames.length > 0) {
    errorParts.push(
      `Exceeds the ${formatLimitMb(maxBytes)} per-file browser memory limit: ${oversizedNames.slice(0, 2).join(', ')}.`
    );
  }

  if (cumulativeExceeded) {
    const remainingMb = Math.max(0, (maxBytes - existingBytes) / (1024 * 1024)).toFixed(1);
    errorParts.push(
      `Cumulative queue limit is ${formatLimitMb(maxBytes)} (${remainingMb} MB remaining in current queue).`
    );
  }

  return {
    validFiles,
    errorMessage: errorParts.length > 0 ? errorParts.join(' ') : null,
  };
}
