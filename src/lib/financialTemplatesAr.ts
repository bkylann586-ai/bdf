import { FinancialTemplateId } from '../types';

export interface ArabicTemplateTranslation {
  name: string;
  shortSummary: string;
  targetAudience: string;
  disclaimer: string;
  sections: Record<string, { title: string; description: string }>;
  fields: Record<string, { label: string; options?: Record<string, string> }>;
}

export const ARABIC_HELPER_DISCLAIMER =
  'تنبيه: نماذج العمل التفاعلية هذه هي قوالب مساعدة للتنظيم المالي الشخصي فقط يتم إنشاؤها محلياً داخل متصفحك. وهي ليست نماذج رسمية صادرة عن أي بنك أو جهة حكومية أو مقرض عقاري، ولا يقوم PDFQuick بجمع أو إرسال أو تخزين أي بيانات مالية تدخلها أو تصدّرها.';

export const FINANCIAL_TEMPLATES_AR: Record<FinancialTemplateId, ArabicTemplateTranslation> = {
  'personal-financial-information': {
    name: 'بيانات الوضع المالي الشخصي',
    shortSummary:
      'ورقة عمل منظمة لصافي الثروة والسيولة المنزلية ترتّب الأصول والالتزامات والدفعات الشهرية للتخطيط الشخصي أو تجهيز طلبات التمويل.',
    targetAudience: 'الأفراد، المشترون للعقارات، ومقدمو طلبات الإيجار',
    disclaimer: ARABIC_HELPER_DISCLAIMER,
    sections: {
      'applicant-profile': {
        title: 'القسم 1: التعريف بالمتقدم وبيانات التواصل',
        description: 'بيانات تواصل أساسية فقط. يتم استبعاد رقم الضمان الاجتماعي وكلمات المرور البنكية وأرقام التعريف الشخصية عمداً.',
      },
      'assets-usd': {
        title: 'القسم 2: ملخص الأصول (USD)',
        description: 'الأرصدة التقريبية المتاحة حالياً والقيم التقديرية للأصول بالدولار الأمريكي.',
      },
      'liabilities-usd': {
        title: 'القسم 3: الالتزامات والديون الشهرية (USD)',
        description: 'الأرصدة المتبقية على الالتزامات الرئيسية والديون الدوارة لاحتساب صافي الثروة.',
      },
    },
    fields: {
      fullLegalName: { label: 'الاسم الكامل' },
      statementAsOfDate: { label: 'تاريخ إعداد الكشف' },
      mailingAddress: { label: 'عنوان السكن الحالي' },
      contactPhone: { label: 'رقم الهاتف الأساسي' },
      cashCheckingSavings: { label: 'السيولة النقدية والحسابات الجارية والادخار (USD)' },
      retirementAccounts: { label: 'حسابات التقاعد (401k / IRA وغيرها) (USD)' },
      marketableSecurities: { label: 'الأسهم وصناديق الاستثمار المتداولة (USD)' },
      realEstateEstimatedValue: { label: 'القيمة السوقية التقديرية للعقارات (USD)' },
      mortgageBalance: { label: 'رصيد القرض العقاري الأول / الثاني (USD)' },
      autoAndInstallmentLoans: { label: 'قروض السيارات والأقساط (USD)' },
      revolvingCreditBalances: { label: 'أرصدة بطاقات الائتمان وخطوط الائتمان (USD)' },
      studentLoansBalance: { label: 'أرصدة القروض التعليمية (USD)' },
    },
  },
  'income-and-expense-statement': {
    name: 'بيان الدخل والمصروفات',
    shortSummary:
      'جدول تفصيلي للتدفق النقدي يقارن إجمالي الدخل الشهري أو السنوي بالضرائب والتكاليف الثابتة والمتغيرة.',
    targetAudience: 'الموظفون، العاملون لحسابهم الخاص، والمتقدمون للإيجار',
    disclaimer: ARABIC_HELPER_DISCLAIMER,
    sections: {
      'reporting-period': {
        title: 'القسم 1: فترة التقرير ومنهجية الاحتساب',
        description: 'حدّد الفترة الزمنية وما إذا كانت الأرقام تمثل إجمالياً شهرياً أم سنوياً.',
      },
      'gross-income': {
        title: 'القسم 2: مصادر الدخل الإجمالي (USD)',
        description: 'سجّل مصادر الدخل قبل الاستقطاعات الضريبية بالدولار الأمريكي.',
      },
      'taxes-and-expenses': {
        title: 'القسم 3: الضرائب والمصروفات الدورية (USD)',
        description: 'الاستقطاعات الضريبية وتكاليف السكن والمرافق والالتزامات المعيشية.',
      },
    },
    fields: {
      preparerName: { label: 'اسم معدّ البيان' },
      reportingBasis: {
        label: 'أساس الاحتساب',
        options: {
          'Monthly Average': 'المتوسط الشهري',
          'Annual Total': 'الإجمالي السنوي',
          'Quarterly Snapshot': 'ملخص ربع سنوي',
        },
      },
      periodRange: { label: 'الفترة الزمنية المشمولة' },
      grossSalaryWages: { label: 'إجمالي الراتب والأجور (USD)' },
      freelance1099Income: { label: 'دخل العمل الحر / 1099 / الأنشطة الجانبية (USD)' },
      rentalAndInvestmentIncome: { label: 'صافي دخل الإيجار أو التوزيعات والفوائد (USD)' },
      payrollIncomeTaxes: { label: 'ضرائب الدخل الفيدرالية والولائية والرواتب (USD)' },
      housingRentOrMortgage: { label: 'السكن (الإيجار أو القسط العقاري والضرائب والتأمين) (USD)' },
      utilitiesAndInsurance: { label: 'المرافق والإنترنت والتأمين الصحي وتأمين المركبات (USD)' },
      foodTransportationDebt: { label: 'الغذاء والمواصلات وخدمة الديون والالتزامات الأخرى (USD)' },
    },
  },
  'monthly-budget': {
    name: 'الميزانية الشهرية',
    shortSummary:
      'مخطط ميزانية أسرية يقارن المخصصات المستهدفة بالإنفاق الفعلي والمدخرات الشهرية.',
    targetAudience: 'الأسر والأفراد لإدارة الدخل الشهري',
    disclaimer: ARABIC_HELPER_DISCLAIMER,
    sections: {
      'budget-header': {
        title: 'القسم 1: شهر الميزانية والدخل الصافي',
        description: 'صافي الدخل الشهري المتاح بعد الاستقطاعات.',
      },
      'fixed-and-essentials': {
        title: 'القسم 2: التزامات السكن والاحتياجات الأساسية (USD)',
        description: 'الإنفاق الأساسي المخطط له شهرياً.',
      },
      'savings-and-goals': {
        title: 'القسم 3: الادخار وسداد الديون والملاحظات',
        description: 'مخصصات صندوق الطوارئ والتقاعد والسداد الإضافي للديون.',
      },
    },
    fields: {
      budgetMonth: { label: 'شهر وسنة الميزانية' },
      netTakeHomePay: { label: 'صافي الدخل الشهري المستلم (USD)' },
      housingPlanned: { label: 'السكن والمرافق (المخطط) (USD)' },
      groceriesPlanned: { label: 'المواد الغذائية والمنزلية (USD)' },
      transportAndFuel: { label: 'المواصلات والوقود والتأمين (USD)' },
      emergencyAndRetirement: { label: 'التحويل إلى صندوق الطوارئ والتقاعد (USD)' },
      extraDebtPaydown: { label: 'الدفعات الإضافية لسداد الديون (USD)' },
      budgetNotes: { label: 'ملاحظات الميزانية والتعديلات' },
    },
  },
  'business-financial-information': {
    name: 'البيانات المالية للمنشأة',
    shortSummary:
      'ملخص مالي للمنشآت الصغيرة والشركات يغطي الإيرادات وتكلفة المبيعات والرواتب والسيولة والديون.',
    targetAudience: 'المؤسسات الفردية، الشركات ذات المسؤولية المحدودة LLC، والأعمال الصغيرة',
    disclaimer: ARABIC_HELPER_DISCLAIMER,
    sections: {
      'entity-details': {
        title: 'القسم 1: تعريف المنشأة (دون أرقام ضريبية EIN أو بيانات دخول)',
        description: 'الاسم القانوني للمنشأة والشكل القانوني والفترة المالية.',
      },
      'operating-summary': {
        title: 'القسم 2: الإيرادات والمصروفات التشغيلية (USD)',
        description: 'أرقام المبيعات الإجمالية وتكاليف التشغيل الأساسية.',
      },
      'liquidity-snapshot': {
        title: 'القسم 3: السيولة والالتزامات (USD)',
        description: 'أرصدة النقد التشغيلي والذمم المدينة والديون القائمة.',
      },
    },
    fields: {
      businessLegalName: { label: 'الاسم القانوني للمنشأة' },
      entityStructure: {
        label: 'الشكل القانوني',
        options: {
          'Sole Proprietorship': 'مؤسسة فردية',
          LLC: 'شركة ذات مسؤولية محدودة (LLC)',
          'S-Corp / C-Corp': 'شركة مساهمة (S-Corp / C-Corp)',
          Partnership: 'شركة تضامن / شراكة',
        },
      },
      fiscalPeriod: { label: 'السنة أو الفترة المالية' },
      grossReceiptsSales: { label: 'إجمالي الإيرادات / المبيعات (USD)' },
      costOfGoodsSold: { label: 'تكلفة البضاعة المباعة / المقاولون (USD)' },
      payrollAndBenefits: { label: 'الرواتب والمزايا وضرائب الرواتب (USD)' },
      rentOverheadUtilities: { label: 'الإيجار والمرافق والتأمين والمصاريف الإدارية (USD)' },
      operatingCashBalance: { label: 'رصيد النقد التشغيلي (USD)' },
      accountsReceivable: { label: 'الذمم المدينة القائمة (USD)' },
      businessDebtBalance: { label: 'أرصدة قروض المنشأة وخطوط الائتمان (USD)' },
    },
  },
  'beneficiary-information': {
    name: 'بيانات المستفيدين',
    shortSummary:
      'ورقة تنظيمية لأسماء المستفيدين الأساسيين والاحتياطيين ونسب التوزيع للمراجعة العائلية والمالية.',
    targetAudience: 'أصحاب الحسابات للتنظيم العائلي ومراجعة المستفيدين',
    disclaimer: ARABIC_HELPER_DISCLAIMER,
    sections: {
      'account-reference': {
        title: 'القسم 1: مرجع الحساب وصاحب السجل',
        description: 'استخدم اسماً وصفياً للحساب دون كتابة أرقام حسابات كاملة أو SSN.',
      },
      'primary-beneficiary': {
        title: 'القسم 2: المستفيد الأساسي',
        description: 'الاسم والعلاقة القانونية ونسبة التوزيع وبيانات التواصل.',
      },
      'contingent-beneficiary': {
        title: 'القسم 3: المستفيد الاحتياطي (اختياري)',
        description: 'المستفيد البديل في حال تعذر استحقاق المستفيد الأساسي.',
      },
    },
    fields: {
      accountOwnerName: { label: 'اسم صاحب الحساب' },
      accountReferenceNickname: { label: 'الوصف المرجعي للحساب (دون رقم الحساب)' },
      primaryFullName: { label: 'الاسم القانوني للمستفيد الأساسي' },
      primaryRelationship: {
        label: 'صلة القرابة',
        options: {
          Spouse: 'زوج / زوجة',
          Child: 'ابن / ابنة',
          Parent: 'والد / والدة',
          Sibling: 'أخ / أخت',
          'Trust / Estate': 'وقف / تركة',
          Other: 'أخرى',
        },
      },
      primarySharePercent: { label: 'نسبة التوزيع الأساسي (%)' },
      primaryContactAddress: { label: 'عنوان التواصل للمستفيد الأساسي' },
      contingentFullName: { label: 'الاسم الكامل للمستفيد الاحتياطي' },
      contingentSharePercent: { label: 'نسبة التوزيع الاحتياطي (%)' },
    },
  },
};

export function translateSummaryLabelAr(label: string): string {
  const map: Record<string, string> = {
    'Total Assets (USD)': 'إجمالي الأصول (USD)',
    'Total Liabilities (USD)': 'إجمالي الالتزامات (USD)',
    'Estimated Net Worth (USD)': 'صافي الثروة التقديري (USD)',
    'Total Gross Income (USD)': 'إجمالي الدخل (USD)',
    'Taxes & Expenses (USD)': 'الضرائب والمصروفات (USD)',
    'Net Cash Flow (USD)': 'صافي التدفق النقدي (USD)',
    'Net Take-Home Pay (USD)': 'صافي الدخل المستلم (USD)',
    'Planned Allocations (USD)': 'المخصصات المخططة (USD)',
    'Unallocated Surplus (USD)': 'الفائض غير المخصص (USD)',
    'Over-Budget Deficit (USD)': 'عجز الميزانية (USD)',
    'Gross Revenue (USD)': 'إجمالي الإيرادات (USD)',
    'Net Operating Snapshot (USD)': 'صافي التشغيل التقديري (USD)',
    'Cash + A/R Minus Debt (USD)': 'النقد + الذمم - الديون (USD)',
    'Primary Allocation': 'حصة المستفيد الأساسي',
    'Contingent Allocation': 'حصة المستفيد الاحتياطي',
    'Not specified': 'غير محدد',
  };
  return map[label] || label;
}
