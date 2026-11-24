import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import type { SeoHeadCollector, SeoHeadSnapshot } from './components/SeoMeta';

import { HomePage } from './pages/HomePage';
import { AllToolsPage } from './pages/AllToolsPage';
import { MergePdfPage } from './pages/MergePdfPage';
import { SplitPdfPage } from './pages/SplitPdfPage';
import { CompressPdfPage } from './pages/CompressPdfPage';
import { ImagesToPdfPage } from './pages/ImagesToPdfPage';
import { PdfToImagesPage } from './pages/PdfToImagesPage';
import { RotatePdfPage } from './pages/RotatePdfPage';
import { DeletePdfPagesPage } from './pages/DeletePdfPagesPage';
import { ReorderPdfPagesPage } from './pages/ReorderPdfPagesPage';
import { AddPageNumbersPage } from './pages/AddPageNumbersPage';
import { WatermarkPdfPage } from './pages/WatermarkPdfPage';
import { OcrPdfPage } from './pages/OcrPdfPage';
import { EditPdfMetadataPage } from './pages/EditPdfMetadataPage';
import { UnlockPdfPage } from './pages/UnlockPdfPage';
import { BankingFinanceHubPage } from './pages/BankingFinanceHubPage';
import { UsBanksIndexPage } from './pages/UsBanksIndexPage';
import { UsBankDetailPage } from './pages/UsBankDetailPage';
import { FinancialTemplatesPage } from './pages/FinancialTemplatesPage';
import { FinancialFormFillerPage } from './pages/FinancialFormFillerPage';
import { FinancialPrivacyRedactionPage } from './pages/FinancialPrivacyRedactionPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { DmcaPage } from './pages/DmcaPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const CANONICAL_PRERENDER_ROUTES: string[] = [
  '/',
  '/tools',
  '/merge-pdf',
  '/split-pdf',
  '/compress-pdf',
  '/images-to-pdf',
  '/pdf-to-images',
  '/rotate-pdf',
  '/delete-pdf-pages',
  '/reorder-pdf-pages',
  '/add-page-numbers',
  '/watermark-pdf',
  '/ocr-pdf',
  '/edit-pdf-metadata',
  '/unlock-pdf',
  '/banking-finance',
  '/banking/us-banks',
  '/banking/us-banks/chase',
  '/banking/us-banks/bank-of-america',
  '/banking/us-banks/wells-fargo',
  '/banking/us-banks/citi',
  '/banking/us-banks/us-bank',
  '/banking/financial-templates',
  '/banking/financial-pdf-form-filler',
  '/banking/financial-document-privacy',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/dmca',
];

function getServerPageElement(routePath: string): React.ReactNode {
  switch (routePath) {
    case '/':
      return <HomePage />;
    case '/tools':
      return <AllToolsPage />;
    case '/merge-pdf':
      return <MergePdfPage />;
    case '/split-pdf':
      return <SplitPdfPage />;
    case '/compress-pdf':
      return <CompressPdfPage />;
    case '/images-to-pdf':
      return <ImagesToPdfPage />;
    case '/pdf-to-images':
      return <PdfToImagesPage />;
    case '/rotate-pdf':
      return <RotatePdfPage />;
    case '/delete-pdf-pages':
      return <DeletePdfPagesPage />;
    case '/reorder-pdf-pages':
      return <ReorderPdfPagesPage />;
    case '/add-page-numbers':
      return <AddPageNumbersPage />;
    case '/watermark-pdf':
      return <WatermarkPdfPage />;
    case '/ocr-pdf':
      return <OcrPdfPage />;
    case '/edit-pdf-metadata':
      return <EditPdfMetadataPage />;
    case '/unlock-pdf':
      return <UnlockPdfPage />;
    case '/banking-finance':
      return <BankingFinanceHubPage />;
    case '/banking/us-banks':
      return <UsBanksIndexPage />;
    case '/banking/us-banks/chase':
      return <UsBankDetailPage bankSlug="chase" />;
    case '/banking/us-banks/bank-of-america':
      return <UsBankDetailPage bankSlug="bank-of-america" />;
    case '/banking/us-banks/wells-fargo':
      return <UsBankDetailPage bankSlug="wells-fargo" />;
    case '/banking/us-banks/citi':
      return <UsBankDetailPage bankSlug="citi" />;
    case '/banking/us-banks/us-bank':
      return <UsBankDetailPage bankSlug="us-bank" />;
    case '/banking/financial-templates':
      return <FinancialTemplatesPage />;
    case '/banking/financial-pdf-form-filler':
      return <FinancialFormFillerPage />;
    case '/banking/financial-document-privacy':
      return <FinancialPrivacyRedactionPage />;
    case '/about':
      return <AboutPage />;
    case '/contact':
      return <ContactPage />;
    case '/privacy':
      return <PrivacyPage />;
    case '/terms':
      return <TermsPage />;
    case '/dmca':
      return <DmcaPage />;
    default:
      return <NotFoundPage />;
  }
}

export function renderRouteToHtml(routePath: string): {
  appHtml: string;
  head: SeoHeadSnapshot;
} {
  const collector: SeoHeadCollector = { snapshot: null };
  const pageElement = getServerPageElement(routePath);

  const appHtml = renderToString(
    <App ssrPath={routePath} ssrPageElement={pageElement} seoCollector={collector} />
  );

  if (!collector.snapshot) {
    throw new Error(`No <SeoMeta> rendered for route: ${routePath}`);
  }

  return {
    appHtml,
    head: collector.snapshot,
  };
}
