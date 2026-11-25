import * as pdfjsLib from 'pdfjs-dist';
import { PDF_WORKER_URL } from './pdfWorkerUrl';

if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function (fn: (...args: any[]) => any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

if (typeof window !== 'undefined' && pdfjsLib?.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
}

export { pdfjsLib };
