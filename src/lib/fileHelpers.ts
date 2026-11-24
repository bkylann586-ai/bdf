/**
 * Lightweight zero-dependency browser file, formatting, and page-range utilities.
 * Kept free of heavy PDF libraries (pdf-lib, pdfjs-dist) so lightweight pages and
 * core UI shell never pull heavy engines into the initial bundle.
 */

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (file && typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      reject(new Error('FileReader is not available in this environment'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as Data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Error reading image file'));
    reader.readAsDataURL(file);
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Parse page range string like "1-3, 5, 7-9" into an array of 0-based page indices.
 * Validates against maxPages.
 */
export function parsePageRange(rangeStr: string, maxPages: number): number[] {
  const pagesSet = new Set<number>();
  const parts = rangeStr
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
        throw new Error(`Invalid page range token: "${part}". Format should be e.g. 1-4`);
      }

      for (let p = start; p <= Math.min(end, maxPages); p++) {
        pagesSet.add(p - 1);
      }
    } else {
      const p = parseInt(part, 10);
      if (isNaN(p) || p < 1 || p > maxPages) {
        throw new Error(`Invalid page number: "${part}". Must be between 1 and ${maxPages}`);
      }
      pagesSet.add(p - 1);
    }
  }

  const sorted = Array.from(pagesSet).sort((a, b) => a - b);
  if (sorted.length === 0) {
    throw new Error('Please specify at least one valid page number');
  }
  return sorted;
}

/**
 * Compress a list of 1-based page numbers into a clean canonical range string, e.g. "1-3, 5, 7-8".
 */
export function formatPageNumbersToRange(pageNumbers: number[]): string {
  const uniqueSorted = Array.from(
    new Set(pageNumbers.filter((n) => Number.isInteger(n) && n >= 1))
  ).sort((a, b) => a - b);

  if (uniqueSorted.length === 0) return '';

  const segments: string[] = [];
  let start = uniqueSorted[0];
  let end = uniqueSorted[0];

  for (let i = 1; i < uniqueSorted.length; i++) {
    const curr = uniqueSorted[i];
    if (curr === end + 1) {
      end = curr;
    } else {
      segments.push(start === end ? `${start}` : `${start}-${end}`);
      start = curr;
      end = curr;
    }
  }
  segments.push(start === end ? `${start}` : `${start}-${end}`);
  return segments.join(', ');
}

/**
 * Safely toggle a 1-based page number inside an existing range string without throwing on partial user input.
 */
export function togglePageInRangeString(
  rangeStr: string,
  pageNumber: number,
  maxPages: number,
  options?: { minRemaining?: number }
): string {
  const selected = new Set<number>();
  const parts = rangeStr
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [aStr, bStr] = part.split('-').map((s) => s.trim());
      const a = parseInt(aStr, 10);
      const b = parseInt(bStr, 10);
      if (!isNaN(a) && !isNaN(b) && a >= 1 && b >= a) {
        for (let p = a; p <= Math.min(b, maxPages); p++) {
          selected.add(p);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= maxPages) {
        selected.add(p);
      }
    }
  }

  if (selected.has(pageNumber)) {
    selected.delete(pageNumber);
  } else {
    const minRemaining = options?.minRemaining ?? 0;
    if (minRemaining > 0 && selected.size + 1 > Math.max(0, maxPages - minRemaining)) {
      return formatPageNumbersToRange(Array.from(selected));
    }
    selected.add(pageNumber);
  }

  return formatPageNumbersToRange(Array.from(selected));
}
