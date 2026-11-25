import { pdfjs } from 'react-pdf';
import { PDF_WORKER_URL } from './pdfWorkerUrl';

if (typeof window !== 'undefined' && pdfjs?.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
}

export { pdfjs };
