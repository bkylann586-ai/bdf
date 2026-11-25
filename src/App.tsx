import React, { Suspense, lazy, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SwUpdatePrompt } from './components/SwUpdatePrompt';
import { SsrRouterProvider, normalizePath, usePathname } from './lib/router';
import { SeoCollectorProvider, SeoHeadCollector } from './components/SeoMeta';
import { LanguageProvider } from './lib/i18n';
import { trackPageView } from './lib/analytics';
import { GlobalDropProvider } from './lib/globalDrop';
import { PerformanceMonitorProvider, usePerformanceMonitor } from './lib/performanceMonitor';
import { initConsentDefaults } from './lib/consent';

// Eagerly loaded homepage & 404 page
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Lazy-loaded tool page chunk loaders (shared with preloadRouteComponent for zero-flash hydration)
const routeLoaders = {
  '/tools': () => import('./pages/AllToolsPage').then((m) => ({ default: m.AllToolsPage })),
  '/about': () => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })),
  '/contact': () => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })),
  '/privacy': () => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
  '/terms': () => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })),
  '/dmca': () => import('./pages/DmcaPage').then((m) => ({ default: m.DmcaPage })),
  '/merge-pdf': () => import('./pages/MergePdfPage').then((m) => ({ default: m.MergePdfPage })),
  '/split-pdf': () => import('./pages/SplitPdfPage').then((m) => ({ default: m.SplitPdfPage })),
  '/compress-pdf': () => import('./pages/CompressPdfPage').then((m) => ({ default: m.CompressPdfPage })),
  '/images-to-pdf': () => import('./pages/ImagesToPdfPage').then((m) => ({ default: m.ImagesToPdfPage })),
  '/pdf-to-images': () => import('./pages/PdfToImagesPage').then((m) => ({ default: m.PdfToImagesPage })),
  '/rotate-pdf': () => import('./pages/RotatePdfPage').then((m) => ({ default: m.RotatePdfPage })),
  '/delete-pdf-pages': () =>
    import('./pages/DeletePdfPagesPage').then((m) => ({ default: m.DeletePdfPagesPage })),
  '/reorder-pdf-pages': () =>
    import('./pages/ReorderPdfPagesPage').then((m) => ({ default: m.ReorderPdfPagesPage })),
  '/add-page-numbers': () =>
    import('./pages/AddPageNumbersPage').then((m) => ({ default: m.AddPageNumbersPage })),
  '/watermark-pdf': () =>
    import('./pages/WatermarkPdfPage').then((m) => ({ default: m.WatermarkPdfPage })),
  '/ocr-pdf': () => import('./pages/OcrPdfPage').then((m) => ({ default: m.OcrPdfPage })),
  '/edit-pdf-metadata': () =>
    import('./pages/EditPdfMetadataPage').then((m) => ({ default: m.EditPdfMetadataPage })),
  '/unlock-pdf': () => import('./pages/UnlockPdfPage').then((m) => ({ default: m.UnlockPdfPage })),
  '/banking-finance': () =>
    import('./pages/BankingFinanceHubPage').then((m) => ({ default: m.BankingFinanceHubPage })),
  '/banking/us-banks': () =>
    import('./pages/UsBanksIndexPage').then((m) => ({ default: m.UsBanksIndexPage })),
  '/banking/us-banks/chase': () =>
    import('./pages/UsBankDetailPage').then((m) => ({ default: m.UsBankDetailPage })),
  '/banking/us-banks/bank-of-america': () =>
    import('./pages/UsBankDetailPage').then((m) => ({ default: m.UsBankDetailPage })),
  '/banking/us-banks/wells-fargo': () =>
    import('./pages/UsBankDetailPage').then((m) => ({ default: m.UsBankDetailPage })),
  '/banking/us-banks/citi': () =>
    import('./pages/UsBankDetailPage').then((m) => ({ default: m.UsBankDetailPage })),
  '/banking/us-banks/us-bank': () =>
    import('./pages/UsBankDetailPage').then((m) => ({ default: m.UsBankDetailPage })),
  '/banking/financial-templates': () =>
    import('./pages/FinancialTemplatesPage').then((m) => ({ default: m.FinancialTemplatesPage })),
  '/banking/financial-pdf-form-filler': () =>
    import('./pages/FinancialFormFillerPage').then((m) => ({
      default: m.FinancialFormFillerPage,
    })),
  '/banking/financial-document-privacy': () =>
    import('./pages/FinancialPrivacyRedactionPage').then((m) => ({
      default: m.FinancialPrivacyRedactionPage,
    })),
} as const;

export async function preloadRouteComponent(path: string): Promise<void> {
  const normalized = normalizePath(path) as keyof typeof routeLoaders;
  const loader = routeLoaders[normalized];
  if (loader) {
    await loader();
  }
}

// Lazy-loaded pages (code-split to reduce initial bundle size)
const AllToolsPage = lazy(routeLoaders['/tools']);
const AboutPage = lazy(routeLoaders['/about']);
const ContactPage = lazy(routeLoaders['/contact']);
const PrivacyPage = lazy(routeLoaders['/privacy']);
const TermsPage = lazy(routeLoaders['/terms']);
const DmcaPage = lazy(routeLoaders['/dmca']);
const MergePdfPage = lazy(routeLoaders['/merge-pdf']);
const SplitPdfPage = lazy(routeLoaders['/split-pdf']);
const CompressPdfPage = lazy(routeLoaders['/compress-pdf']);
const ImagesToPdfPage = lazy(routeLoaders['/images-to-pdf']);
const PdfToImagesPage = lazy(routeLoaders['/pdf-to-images']);
const RotatePdfPage = lazy(routeLoaders['/rotate-pdf']);
const DeletePdfPagesPage = lazy(routeLoaders['/delete-pdf-pages']);
const ReorderPdfPagesPage = lazy(routeLoaders['/reorder-pdf-pages']);
const AddPageNumbersPage = lazy(routeLoaders['/add-page-numbers']);
const WatermarkPdfPage = lazy(routeLoaders['/watermark-pdf']);
const OcrPdfPage = lazy(routeLoaders['/ocr-pdf']);
const EditPdfMetadataPage = lazy(routeLoaders['/edit-pdf-metadata']);
const UnlockPdfPage = lazy(routeLoaders['/unlock-pdf']);
const BankingFinanceHubPage = lazy(routeLoaders['/banking-finance']);
const UsBanksIndexPage = lazy(routeLoaders['/banking/us-banks']);
const UsBankDetailPage = lazy(routeLoaders['/banking/us-banks/chase']);
const FinancialTemplatesPage = lazy(routeLoaders['/banking/financial-templates']);
const FinancialFormFillerPage = lazy(routeLoaders['/banking/financial-pdf-form-filler']);
const FinancialPrivacyRedactionPage = lazy(routeLoaders['/banking/financial-document-privacy']);

const ToolPageFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    className="flex-1 flex flex-col items-center justify-center py-24 px-4 bg-slate-50/60"
  >
    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
    <p className="text-sm font-medium text-slate-600">Loading PDF tool...</p>
  </div>
);

interface AppContentProps {
  ssrPageElement?: React.ReactNode;
}

function AppContent({ ssrPageElement }: AppContentProps) {
  const currentPath = usePathname();
  const { resetRun } = usePerformanceMonitor();

  useEffect(() => {
    initConsentDefaults();
  }, []);

  useEffect(() => {
    // Canonicalize /home -> / cleanly if reached via client router
    if (currentPath === '/home' && typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/');
    }
    trackPageView(currentPath);
    resetRun();
  }, [currentPath, resetRun]);

  const renderCurrentPage = () => {
    if (ssrPageElement) {
      return ssrPageElement;
    }

    switch (currentPath) {
      case '/':
      case '/home':
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
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Header currentPath={currentPath} />
      <main className="flex-1 flex flex-col">
        <ErrorBoundary resetKey={currentPath}>
          <Suspense fallback={<ToolPageFallback />}>
            {renderCurrentPage()}
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <OfflineIndicator />
      <SwUpdatePrompt />
    </div>
  );
}

export interface AppProps {
  ssrPath?: string;
  ssrPageElement?: React.ReactNode;
  seoCollector?: SeoHeadCollector;
}

export default function App({ ssrPath, ssrPageElement, seoCollector }: AppProps = {}) {
  const tree = (
    <LanguageProvider>
      <GlobalDropProvider>
        <PerformanceMonitorProvider>
          <ErrorBoundary>
            <AppContent ssrPageElement={ssrPageElement} />
          </ErrorBoundary>
        </PerformanceMonitorProvider>
      </GlobalDropProvider>
    </LanguageProvider>
  );

  const wrappedWithSeo = seoCollector ? (
    <SeoCollectorProvider collector={seoCollector}>{tree}</SeoCollectorProvider>
  ) : (
    tree
  );

  return ssrPath ? (
    <SsrRouterProvider path={ssrPath}>{wrappedWithSeo}</SsrRouterProvider>
  ) : (
    wrappedWithSeo
  );
}
