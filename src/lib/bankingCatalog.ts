import { BankingServiceMeta, UsBankGuide, UsBankSlug } from '../types';

export const BANKING_SERVICES: BankingServiceMeta[] = [
  {
    id: 'bank-statement-merger',
    number: 1,
    name: 'Bank Statement Merger',
    shortDescription:
      'Combine 2 to 24 monthly checking, savings, or credit card PDFs into one underwriting-ready packet in chronological order.',
    status: 'active',
    primaryPath: '/merge-pdf',
    linkedToolIds: ['merge-pdf'],
    usUseCases: [
      'US mortgage 60-day bank statement packets (Fannie Mae / Freddie Mac)',
      'SBA 7(a) & business line-of-credit applications',
      'CPA tax year consolidation across checking and credit accounts',
    ],
    keywords: [
      'bank statement merger',
      'combine bank statements',
      'merge checking statements',
      'mortgage statement packet',
      'underwriting pdf',
      'chase',
      'bank of america',
      'wells fargo',
      'citi',
      'us bank',
    ],
  },
  {
    id: 'bank-statement-splitter',
    number: 2,
    name: 'Bank Statement Splitter',
    shortDescription:
      'Isolate a specific statement month, transaction page, or tax summary out of multi-month financial PDF packets.',
    status: 'active',
    primaryPath: '/split-pdf',
    linkedToolIds: ['split-pdf'],
    usUseCases: [
      'Separating annual consolidated 12-month statements by billing cycle',
      'Extracting proof-of-deposit or wire confirmation pages for escrow',
      'Removing multi-account sections before sharing single-account records',
    ],
    keywords: [
      'bank statement splitter',
      'split annual bank statement',
      'extract deposit page',
      'separate account statement',
      'escrow proof',
    ],
  },
  {
    id: 'bank-statement-compressor',
    number: 3,
    name: 'Bank Statement Compressor',
    shortDescription:
      'Reduce oversized scanned statements and check-image PDFs to satisfy US mortgage portal and lender upload limits.',
    status: 'active',
    primaryPath: '/compress-pdf',
    linkedToolIds: ['compress-pdf'],
    usUseCases: [
      'Fitting scanned statements under 5 MB or 10 MB lender upload portals',
      'Shrinking check-image heavy business bank statements',
      'Keeping legible text while stripping bloated embedded scanner overhead',
    ],
    keywords: [
      'bank statement compressor',
      'compress financial pdf',
      'lender upload limit',
      'reduce bank pdf size',
      'shrink scanned statement',
    ],
  },
  {
    id: 'financial-pdf-organizer',
    number: 4,
    name: 'Financial PDF Organizer',
    shortDescription:
      'Sort out-of-order statement pages chronologically, reverse duplex scans, or delete blank disclosure and marketing inserts.',
    status: 'active',
    primaryPath: '/reorder-pdf-pages',
    linkedToolIds: ['reorder-pdf-pages', 'delete-pdf-pages'],
    secondaryLinks: [
      { label: 'Delete Unwanted Pages', path: '/delete-pdf-pages' },
      { label: 'Reorder & Reverse Pages', path: '/reorder-pdf-pages' },
    ],
    usUseCases: [
      'Deleting "This page intentionally left blank" and card promo inserts',
      'Arranging January-to-December statements in chronological sequence',
      'Removing non-essential disclosure appendices before audit submission',
    ],
    keywords: [
      'financial pdf organizer',
      'remove blank bank statement pages',
      'reorder financial pdf',
      'delete bank disclosure page',
      'chronological statements',
    ],
  },
  {
    id: 'bank-document-converter',
    number: 5,
    name: 'Bank Document Converter',
    shortDescription:
      'Convert smartphone photos of paper checks, wire receipts, and W-2/1099 slips into US Letter PDFs—or export PDF pages as images.',
    status: 'active',
    primaryPath: '/images-to-pdf',
    linkedToolIds: ['images-to-pdf', 'pdf-to-images'],
    secondaryLinks: [
      { label: 'Photos & Receipts to PDF', path: '/images-to-pdf' },
      { label: 'Statement Pages to PNG/JPG', path: '/pdf-to-images' },
    ],
    usUseCases: [
      'Converting receipt & cashier-check photos into US Letter 8.5 x 11 in PDFs',
      'Turning paper deposit slips into multi-page expense documentation',
      'Exporting crisp PNG previews of specific statement charts or schedules',
    ],
    keywords: [
      'bank document converter',
      'receipts to pdf',
      'check photo to pdf',
      'us letter financial pdf',
      'statement to png',
      '1099 jpg to pdf',
    ],
  },
  {
    id: 'financial-pdf-watermark',
    number: 6,
    name: 'Financial PDF Watermark',
    shortDescription:
      'Stamp "CONFIDENTIAL", "FOR LENDER REVIEW ONLY", or "COPY" across sensitive statements and tax exhibits before external sharing.',
    status: 'active',
    primaryPath: '/watermark-pdf',
    linkedToolIds: ['watermark-pdf'],
    usUseCases: [
      'Marking statements strictly for landlord or mortgage broker review',
      'Labeling draft P&L schedules as "DRAFT – UNAUDITED"',
      'Applying recipient-specific diagonal stamps to deter unauthorized reuse',
    ],
    keywords: [
      'financial pdf watermark',
      'watermark bank statement',
      'confidential statement stamp',
      'draft financial report watermark',
      'lender copy stamp',
    ],
  },
  {
    id: 'financial-pdf-page-numbering',
    number: 7,
    name: 'Financial PDF Page Numbering',
    shortDescription:
      'Add sequential "Page 1 of N" numbering across US Letter financial exhibits, loan binders, and CPA audit workpapers.',
    status: 'active',
    primaryPath: '/add-page-numbers',
    linkedToolIds: ['add-page-numbers'],
    usUseCases: [
      'Indexing multi-statement loan packages and due-diligence binders',
      'Paginating CPA audit schedules while skipping the cover transmittal page',
      'Formatting exhibits cleanly on US Letter and UK/ISO A4 paper sizes',
    ],
    keywords: [
      'financial pdf page numbering',
      'number loan binder pdf',
      'bates style page numbering',
      'audit packet pagination',
      'page n of total',
    ],
  },
  {
    id: 'bank-document-rotator',
    number: 8,
    name: 'Bank Document Rotator',
    shortDescription:
      'Fix sideways landscape transaction tables, 1099 forms, and upside-down check scans permanently by 90°, 180°, or 270°.',
    status: 'active',
    primaryPath: '/rotate-pdf',
    linkedToolIds: ['rotate-pdf'],
    usUseCases: [
      'Turning wide landscape 1099-B brokerage or year-end interest summaries upright',
      'Correcting upside-down mobile scanner feeds of signed loan disclosures',
      'Rotating only landscape appendix pages inside a mixed-orientation packet',
    ],
    keywords: [
      'bank document rotator',
      'rotate 1099 pdf',
      'rotate landscape bank statement',
      'fix sideways check scan',
      'permanent pdf rotation',
    ],
  },
  {
    id: 'financial-pdf-form-filler',
    number: 9,
    name: 'Financial PDF Form Filler',
    shortDescription:
      'Fill out Personal Financial, Income & Expense, Monthly Budget, Business Financial, and Beneficiary helper worksheets locally and export print-ready US Letter or A4 PDFs.',
    status: 'active',
    primaryPath: '/banking/financial-pdf-form-filler',
    linkedToolIds: [],
    secondaryLinks: [
      { label: 'Inspect Field Schemas', path: '/banking/financial-templates' },
    ],
    usUseCases: [
      'Preparing Personal Financial Information & Net Worth worksheets in USD',
      'Building print-ready US Letter or A4 Income & Expense and Monthly Budget PDFs',
      'Organizing Business P&L and Beneficiary allocation worksheets strictly in browser RAM',
    ],
    keywords: [
      'financial pdf form filler',
      'personal financial statement helper',
      'income and expense template',
      'monthly budget pdf',
      'business financial form',
      'beneficiary information template',
      'usd worksheet',
      'us letter pdf',
    ],
  },
  {
    id: 'financial-document-privacy',
    number: 10,
    name: 'Financial Document Privacy Tools',
    shortDescription:
      'True destructive area redaction and Metadata/XMP scrubbing: preview PDF pages, draw sensitive blackout regions, flatten pixels permanently, and verify zero extractable redacted text.',
    status: 'active',
    primaryPath: '/banking/financial-document-privacy',
    linkedToolIds: [],
    secondaryLinks: [
      { label: 'Delete Whole Pages', path: '/delete-pdf-pages' },
    ],
    usUseCases: [
      'Destroying account suffixes, addresses, or sensitive lines visually and structurally (NOT cosmetic overlays)',
      'Scrubbing Author, Title, Creator, timestamps, annotations, and XMP streams',
      'Comparing Before vs After previews with automated post-export verification',
    ],
    keywords: [
      'financial document privacy tools',
      'true pdf redaction',
      'remove account number pdf',
      'scrub pdf metadata',
      'xmp scrubber',
      'destructive redaction',
      'pdf redaction privacy',
    ],
  },
];

export const US_BANK_GUIDES: UsBankGuide[] = [
  {
    slug: 'chase',
    path: '/banking/us-banks/chase',
    bankName: 'Chase',
    legalEntityNote:
      'Independent user workflow guide for PDFs downloaded by JPMorgan Chase Bank, N.A. customers. PDFQuick is not affiliated with, endorsed by, or integrated with Chase.',
    headline: 'Preparing & Organizing Chase Bank Statement PDFs Locally',
    metaTitle: 'Chase Bank Statement PDF Guide – Merge, Split & Organize | PDFQuick',
    metaDescription:
      'Step-by-step privacy-first guide to merging, splitting, rotating, and compressing Chase checking, savings, and credit card PDF statements locally in your browser.',
    overview:
      'When preparing a US mortgage application, apartment lease packet, or CPA tax binder using Chase Personal Checking, Chase Business Complete Banking, or Chase Sapphire/Ink credit card statements, borrowers often need 2 to 12 separate monthly PDFs combined into a single chronological file.',
    commonStatementTasks: [
      'Merging consecutive 60-day or 90-day Chase checking and savings statements into one underwriting packet',
      'Deleting recurring legal disclosure tail pages and promotional insert sheets to shorten lender review',
      'Splitting consolidated year-end transaction PDFs to isolate single business expense months',
      'Compressing check-image-heavy statement exports to satisfy strict mortgage upload portal limits',
    ],
    recommendedWorkflows: [
      {
        title: 'Build 60-Day Mortgage Underwriting Packet',
        description: 'Combine two or three monthly Chase PDF statements in chronological order cleanly without uploading account numbers.',
        toolPath: '/merge-pdf',
        toolLabel: 'Open Merge PDF',
      },
      {
        title: 'Strip Promotional & Blank Trailing Pages',
        description: 'Remove trailing fee schedules or blank separator pages before sending statements to a landlord or lender.',
        toolPath: '/delete-pdf-pages',
        toolLabel: 'Open Delete PDF Pages',
      },
      {
        title: 'Mark Copy "For Underwriting Only"',
        description: 'Apply a diagonal recipient watermark so shared statement copies clearly state their authorized purpose.',
        toolPath: '/watermark-pdf',
        toolLabel: 'Open Watermark PDF',
      },
    ],
    viewerUnlockTip:
      'If a Chase statement PDF prompts that it carries owner permission restrictions when loading in PDFQuick, open your downloaded file locally in Chrome, Edge, or macOS Preview, verify you are permitted to print your own copy, and use "Print -> Save as PDF" on your device to create an unrestricted working PDF before processing.',
    faqs: [
      {
        question: 'Does PDFQuick connect to my Chase online banking login?',
        answer: 'No. PDFQuick never asks for Chase usernames, passwords, account numbers, or Plaid/Open Banking credentials. You only work offline or in-browser with PDF files you already downloaded onto your device.',
      },
      {
        question: 'How do I combine 3 months of Chase checking statements into one PDF?',
        answer: 'Download each monthly statement PDF from your Chase account, open PDFQuick Merge PDF, load the files in chronological order using the arrow buttons, and click Merge PDFs Now. Processing happens strictly in your browser memory.',
      },
      {
        question: 'Can I remove the general terms and disclosure pages at the end of a Chase statement?',
        answer: 'Yes. Open Delete PDF Pages, enter the trailing page numbers shown in your statement viewer (for example "4-6"), and download the trimmed PDF containing only your summary and transaction ledger.',
      },
      {
        question: 'Why did PDFQuick reject a locked Chase PDF?',
        answer: 'Some bank exports embed owner-permission or encryption flags inside the PDF trailer. PDFQuick intentionally refuses encrypted PDFs rather than silently bypassing locks. If you own the file, save an unlocked print copy locally via Print to PDF.',
      },
      {
        question: 'Are my Chase account balances or routing numbers stored by PDFQuick?',
        answer: 'Never. Files remain strictly inside your browser tab RAM and are never uploaded to servers, databases, or localStorage.',
      },
    ],
  },
  {
    slug: 'bank-of-america',
    path: '/banking/us-banks/bank-of-america',
    bankName: 'Bank of America',
    legalEntityNote:
      'Independent user workflow guide for PDFs downloaded by Bank of America, N.A. customers. PDFQuick is not affiliated with, endorsed by, or integrated with Bank of America.',
    headline: 'Preparing Bank of America Statement & eStatement PDFs Privately',
    metaTitle: 'Bank of America PDF Statement Guide – Organize & Compress | PDFQuick',
    metaDescription:
      'Organize Bank of America Advantage Checking, business, and credit card PDF statements offline in your browser: merge months, trim inserts, compress, and number pages.',
    overview:
      'Bank of America eStatements for Advantage Checking, Business Fundamentals, and Preferred Rewards credit cards often include multi-page check images, reconciliation worksheets, and summary disclosures. Organizing them locally prevents sensitive routing details and deposit histories from hitting third-party servers.',
    commonStatementTasks: [
      'Combining multiple Bank of America checking and credit card cycles for loan pre-approval',
      'Shrinking check-image PDFs that exceed employer reimbursement or lender size limits',
      'Deleting reconciliation worksheets and blank summary pages before sharing with an accountant',
      'Adding "Page 1 of N" numbering across combined annual audit packets',
    ],
    recommendedWorkflows: [
      {
        title: 'Compress Image-Heavy Check Statements',
        description: 'Use Balanced 140 DPI optimization when embedded check scans push your monthly statement above upload caps.',
        toolPath: '/compress-pdf',
        toolLabel: 'Open Compress PDF',
      },
      {
        title: 'Assemble & Number CPA Audit Binders',
        description: 'Merge statements chronologically, then stamp clear footer page numbers across every US Letter sheet.',
        toolPath: '/add-page-numbers',
        toolLabel: 'Open Add Page Numbers',
      },
      {
        title: 'Reorder Combined Statements Cleanly',
        description: 'Swap statement sequence or reverse stacked pages without re-downloading files.',
        toolPath: '/reorder-pdf-pages',
        toolLabel: 'Open Reorder PDF Pages',
      },
    ],
    viewerUnlockTip:
      'Should a downloaded Bank of America PDF carry document-assembly restrictions, PDFQuick will alert you cleanly. Use your operating system PDF viewer (macOS Preview Export as PDF or Chrome Save as PDF) on your local machine first, then process that clean copy.',
    faqs: [
      {
        question: 'Is PDFQuick partnered with Bank of America?',
        answer: 'No. PDFQuick is an independent client-side PDF toolkit and has no partnership, endorsement, or technical connection with Bank of America or Merrill.',
      },
      {
        question: 'Why are Bank of America PDFs with cancelled check images so large?',
        answer: 'Embedded front-and-back check scan images increase file size significantly compared to plain text tables. Balanced compression reduces embedded raster resolution cleanly in your browser while preserving readable numbers.',
      },
      {
        question: 'Can I extract just one deposit confirmation page from a 14-page statement?',
        answer: 'Yes. Open Split PDF, select Custom Page Range, enter the exact page number showing your deposit or wire entry, and export a single-page PDF.',
      },
      {
        question: 'Does PDFQuick cache my Bank of America statements in browser storage?',
        answer: 'No. PDF buffers live only in volatile tab memory during active processing and are released when you reset or close the tab.',
      },
      {
        question: 'Can I number pages across 6 merged statements starting from Page 1?',
        answer: 'Yes. After combining your monthly files in Merge PDF, open Add Page Numbers on the merged document to apply consistent "Page 1 of N" footers.',
      },
    ],
  },
  {
    slug: 'wells-fargo',
    path: '/banking/us-banks/wells-fargo',
    bankName: 'Wells Fargo',
    legalEntityNote:
      'Independent user workflow guide for PDFs downloaded by Wells Fargo Bank, N.A. customers. PDFQuick is not affiliated with, endorsed by, or integrated with Wells Fargo.',
    headline: 'Organizing Wells Fargo Statement & Loan Document PDFs in Browser',
    metaTitle: 'Wells Fargo PDF Statement Guide – Rotate, Watermark & Merge | PDFQuick',
    metaDescription:
      'Handle Wells Fargo checking, mortgage, and business account statement PDFs privately in your browser: fix sideways scans, watermark lender copies, and merge statements.',
    overview:
      'Wells Fargo customers preparing home equity, auto, or small-business financing packages frequently mix downloaded digital statements with scanned paper letters and wide landscape transaction printouts. Managing these files strictly inside browser RAM safeguards household financial privacy.',
    commonStatementTasks: [
      'Rotating sideways landscape year-end tax/dividend reports or scanned Wells Fargo check copies',
      'Combining checking, savings, and home mortgage escrow PDFs for refinancing',
      'Applying transparent "CONFIDENTIAL – FOR VERIFICATION ONLY" diagonal watermarks',
      'Splitting multi-month statements to extract a single 30-day income verification window',
    ],
    recommendedWorkflows: [
      {
        title: 'Fix Sideways Landscape Summaries',
        description: 'Permanently rotate sideways 90° or upside-down 180° pages so every table opens upright.',
        toolPath: '/rotate-pdf',
        toolLabel: 'Open Rotate PDF',
      },
      {
        title: 'Combine Receipt Scans With Digital Statements',
        description: 'Convert photos of cashier checks or branch deposit slips into US Letter PDF pages before merging.',
        toolPath: '/images-to-pdf',
        toolLabel: 'Open Images to PDF',
      },
      {
        title: 'Stamp Lender-Specific Watermarks',
        description: 'Mark outgoing copies clearly before attaching them to rental or loan portals.',
        toolPath: '/watermark-pdf',
        toolLabel: 'Open Watermark PDF',
      },
    ],
    viewerUnlockTip:
      'Never upload password-locked Wells Fargo PDFs to third-party password cracker websites. If a statement uses owner restrictions, save an unlocked copy locally using your browser Print -> Save as PDF dialog on your own computer before editing.',
    faqs: [
      {
        question: 'Can PDFQuick unlock a password-protected Wells Fargo PDF for me?',
        answer: 'No. PDFQuick intentionally refuses encrypted PDFs to protect security and compliance. Unlock your own authorized file locally in your PDF reader or browser Print-to-PDF first.',
      },
      {
        question: 'How do I fix a single upside-down page inside a Wells Fargo closing packet?',
        answer: 'Open Rotate PDF, select 180° Upside Down, choose Specific Page Range, type that single page number, and export the corrected PDF.',
      },
      {
        question: 'Does adding a watermark obscure my Wells Fargo transaction amounts?',
        answer: 'You control opacity (from 15% to 65%), color, and layout, keeping underlying balances and dates completely readable while marking the copy confidential.',
      },
      {
        question: 'Can I turn my Wells Fargo paper branch deposit receipt photo into a PDF?',
        answer: 'Yes. Use Images to PDF, select US Letter sizing, and convert JPG or PNG receipt photos locally in seconds.',
      },
      {
        question: 'Is there any official connection between PDFQuick and Wells Fargo?',
        answer: 'None. PDFQuick is a general client-side PDF utility with zero integration or endorsement from Wells Fargo.',
      },
    ],
  },
  {
    slug: 'citi',
    path: '/banking/us-banks/citi',
    bankName: 'Citi',
    legalEntityNote:
      'Independent user workflow guide for PDFs downloaded by Citibank, N.A. customers. PDFQuick is not affiliated with, endorsed by, or integrated with Citi.',
    headline: 'Managing Citi Statement & Credit Card Billing PDFs Privately',
    metaTitle: 'Citi Bank & Credit Card Statement PDF Guide | PDFQuick',
    metaDescription:
      'Split, merge, number, and compress Citibank checking and Citi credit card PDF billing statements strictly inside your browser with zero cloud uploads.',
    overview:
      'Citi checking, savings, and Citi credit card customers—including frequent international travelers and US corporate cardholders—often need to isolate specific expense-report charges, combine multi-currency trip receipts with monthly statements, or prepare tidy tax-deductible documentation.',
    commonStatementTasks: [
      'Splitting multi-page Citi card billing statements to submit only business-travel pages for reimbursement',
      'Merging Citi monthly statements with hotel and airfare receipt PDFs into one expense report',
      'Converting Citi billing PDFs to crisp PNG/JPG pages for corporate accounting attachments',
      'Compressing 12-month Citi statement archives before emailing an accountant',
    ],
    recommendedWorkflows: [
      {
        title: 'Extract Business Expense Pages Only',
        description: 'Pull just the statement pages relevant to a client trip instead of sharing your full monthly card history.',
        toolPath: '/split-pdf',
        toolLabel: 'Open Split PDF',
      },
      {
        title: 'Merge Statement + Travel Receipts',
        description: 'Combine your billing summary with vendor invoices into one clean chronological expense binder.',
        toolPath: '/merge-pdf',
        toolLabel: 'Open Merge PDF',
      },
      {
        title: 'Render Statement Pages to PNG Images',
        description: 'Convert specific pages to high-DPI PNG pictures for slide decks or expense portal image fields.',
        toolPath: '/pdf-to-images',
        toolLabel: 'Open PDF to Images',
      },
    ],
    viewerUnlockTip:
      'For annual Citi Year-End Summary PDFs that span dozens of pages, use Split PDF first to keep only the tax category pages you actually need before applying page numbers or watermarks.',
    faqs: [
      {
        question: 'Can I extract just Page 2 of my Citi credit card statement for employer reimbursement?',
        answer: 'Yes. Open Split PDF, select Custom Page Range, enter "2", and download a standalone 1-page PDF containing only that section.',
      },
      {
        question: 'Note on privacy: Does PDFQuick see my Citi transaction merchants or card number?',
        answer: 'No. Because PDFQuick runs 100% client-side in your browser, no server ever receives your Citi PDF or transaction text.',
      },
      {
        question: 'Can I convert a Citi PDF page into a PNG image to attach inside an expense portal that rejects PDFs?',
        answer: 'Yes. Use PDF to Images, select PNG and 2.0x Crisp Resolution, and download individual page images or a ZIP archive.',
      },
      {
        question: 'Does PDFQuick store any statement history in localStorage?',
        answer: 'Financial document contents are never stored anywhere. Even optional anonymous usage counters are disabled by default.',
      },
      {
        question: 'Are you affiliated with Citibank or Citigroup?',
        answer: 'No. PDFQuick is an independent browser tool not affiliated with or approved by Citi or Citigroup Inc.',
      },
    ],
  },
  {
    slug: 'us-bank',
    path: '/banking/us-banks/us-bank',
    bankName: 'U.S. Bank',
    legalEntityNote:
      'Independent user workflow guide for PDFs downloaded by U.S. Bank National Association customers. PDFQuick is not affiliated with, endorsed by, or integrated with U.S. Bank.',
    headline: 'Organizing U.S. Bank Checking, Business & SBA Loan PDFs Locally',
    metaTitle: 'U.S. Bank Statement PDF Guide – Merge, Delete Pages & Convert | PDFQuick',
    metaDescription:
      'Organize U.S. Bank Smartly Checking and business statement PDFs locally in your browser: merge monthly cycles, remove blank pages, convert receipts, and watermark.',
    overview:
      'U.S. Bank personal and small-business account holders regularly assemble multi-month statement bundles, check copies, and vendor invoices for SBA financing, commercial leases, and annual state/federal tax filings. Handling everything in local browser memory eliminates third-party SaaS upload risks.',
    commonStatementTasks: [
      'Consolidating U.S. Bank Business Checking statements for quarterly bookkeeping reviews',
      'Turning smartphone photos of paper deposit receipts into properly framed US Letter PDFs',
      'Reordering mixed statement cycles or reversing back-to-front office scanner batches',
      'Deleting blank separator pages and redundant fee schedules before lender upload',
    ],
    recommendedWorkflows: [
      {
        title: 'Convert Mobile Receipts to US Letter PDF',
        description: 'Frame smartphone photos onto clean 8.5 x 11 inch US Letter pages with balanced margins.',
        toolPath: '/images-to-pdf',
        toolLabel: 'Open Images to PDF',
      },
      {
        title: 'Reverse & Clean Up Scanner Stacks',
        description: 'Flip upside-order physical scans chronologically in one click and drop blank divider sheets.',
        toolPath: '/reorder-pdf-pages',
        toolLabel: 'Open Reorder PDF Pages',
      },
      {
        title: 'Consolidate Quarterly Business Packets',
        description: 'Combine monthly checking statements and converted deposit receipts into one indexed PDF.',
        toolPath: '/merge-pdf',
        toolLabel: 'Open Merge PDF',
      },
    ],
    viewerUnlockTip:
      'Check page counts after merging multi-month U.S. Bank statements and use Add Page Numbers with "Skip cover page" enabled if you prepend a CPA cover memo.',
    faqs: [
      {
        question: 'Can I combine U.S. Bank checking PDFs with scanned paper invoices?',
        answer: 'Yes. First convert paper invoice photos to PDF with Images to PDF using US Letter sizing, then merge them together with your downloaded statement PDFs in Merge PDF.',
      },
      {
        question: 'My office scanner fed 6 pages of statements backward. Can I fix that quickly?',
        answer: 'Yes. Open Reorder PDF Pages, load your PDF, and click "Reverse Order" to flip the entire sequence back to chronological order in one click.',
      },
      {
        question: 'Is there a subscription or file limit on U.S. Bank PDF workflows?',
        answer: 'PDFQuick is completely free with no accounts or paywalls. A 250 MB safety limit applies per file and multi-file queue to protect browser memory stability.',
      },
      {
        question: 'Does PDFQuick alter numbers, dates, or balances inside my U.S. Bank PDF?',
        answer: 'Never. Tools like Merge, Split, Reorder, Delete Pages, and Rotate preserve original ledger content losslessly—and PDFQuick prohibits any financial document tampering features.',
      },
      {
        question: 'Is PDFQuick endorsed by U.S. Bank?',
        answer: 'No. PDFQuick is an independent software utility with zero affiliation, integration, or endorsement from U.S. Bank National Association.',
      },
    ],
  },
];

export function getUsBankGuideBySlug(slug: string): UsBankGuide | undefined {
  return US_BANK_GUIDES.find((b) => b.slug === slug);
}

export function searchBankingServices(query: string): BankingServiceMeta[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return BANKING_SERVICES;

  return BANKING_SERVICES.filter((service) => {
    const haystack = [
      service.name,
      service.shortDescription,
      service.status,
      ...service.usUseCases,
      ...service.keywords,
    ]
      .join(' ')
      .toLowerCase();

    return normalized.split(/\s+/).every((term) => haystack.includes(term));
  });
}
