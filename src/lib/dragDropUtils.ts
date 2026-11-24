/**
 * Utilities for reliable native File drag-and-drop detection and extraction
 * across browser DataTransfer payloads.
 */

export function hasNativeFilesInDragEvent(
  dataTransfer: DataTransfer | null | undefined
): boolean {
  if (!dataTransfer) return false;

  if (dataTransfer.types) {
    const types = Array.from(dataTransfer.types);
    if (types.includes('Files') || types.includes('application/x-moz-file')) {
      return true;
    }
  }

  if (dataTransfer.items && dataTransfer.items.length > 0) {
    for (let i = 0; i < dataTransfer.items.length; i++) {
      if (dataTransfer.items[i].kind === 'file') {
        return true;
      }
    }
  }

  if (dataTransfer.files && dataTransfer.files.length > 0) {
    return true;
  }

  return false;
}

export function extractNativeFiles(
  dataTransfer: DataTransfer | null | undefined
): File[] {
  if (!dataTransfer) return [];

  if (dataTransfer.files && dataTransfer.files.length > 0) {
    return Array.from(dataTransfer.files).filter(
      (file): file is File => Boolean(file)
    );
  }

  if (dataTransfer.items && dataTransfer.items.length > 0) {
    const extracted: File[] = [];
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          extracted.push(file);
        }
      }
    }
    return extracted;
  }

  return [];
}
