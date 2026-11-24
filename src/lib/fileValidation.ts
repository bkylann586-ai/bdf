export const MAX_SAFE_BROWSER_BYTES = 250 * 1024 * 1024; // 250 MB

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
 * Shared file validation enforcing accepted file types, 250 MB per-file cap,
 * and 250 MB cumulative queue cap across normal uploads, Add More, and global drop.
 */
export function validateSelectedFiles(
  incomingFiles: File[] | FileList | null,
  options: FileValidationOptions
): FileValidationResult {
  if (!incomingFiles || incomingFiles.length === 0) {
    return { validFiles: [], errorMessage: null };
  }

  const maxBytes = options.maxTotalBytes ?? MAX_SAFE_BROWSER_BYTES;
  const existingBytes = Math.max(0, options.existingTotalBytes ?? 0);
  const filesArray = Array.from(incomingFiles);
  const candidates = options.multiple ? filesArray : [filesArray[0]];

  const validFiles: File[] = [];
  const invalidTypeNames: string[] = [];
  const oversizedNames: string[] = [];
  let cumulativeExceeded = false;
  let runningTotalBytes = existingBytes;

  for (const file of candidates) {
    if (!isFileAccepted(file, options.accept)) {
      invalidTypeNames.push(file.name || 'Unnamed file');
      continue;
    }

    if (file.size > maxBytes) {
      oversizedNames.push(`${file.name} (${formatSizeMb(file.size)})`);
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
