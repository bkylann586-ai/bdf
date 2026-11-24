import { getProductionBaseUrl } from '../components/SeoMeta';

export interface FaqSchemaItem {
  question: string;
  answer: string;
}

export interface FaqSchemaOptions {
  toolId?: string;
  pageUrl?: string;
  scriptId?: string;
}

export const DEFAULT_FAQ_SCHEMA_SCRIPT_ID = 'pdfquick-faq-jsonld';

/**
 * Generate a valid Schema.org FAQPage JSON-LD object from a list of question/answer pairs.
 */
export function generateFaqSchema(
  questions: { question: string; answer: string }[],
  pageUrl?: string
): Record<string, any> {
  const validQuestions = questions
    .map((faq) => ({
      question: faq.question.trim(),
      answer: faq.answer.trim(),
    }))
    .filter((faq) => faq.question.length > 0 && faq.answer.length > 0);

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: validQuestions.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  if (pageUrl) {
    schema['@id'] = `${pageUrl}#faq`;
    schema.url = pageUrl;
  }

  return schema;
}

/**
 * Build a Schema.org FAQPage JSON-LD object, returning null when no valid items are present.
 */
export function buildFaqSchemaJsonLd(
  faqs: FaqSchemaItem[],
  pageUrl?: string
): Record<string, any> | null {
  const schema = generateFaqSchema(faqs, pageUrl);
  return schema.mainEntity.length > 0 ? schema : null;
}

/**
 * Inject (or update) a dedicated FAQPage JSON-LD <script> in document.head
 * and return a cleanup function that removes it when leaving the tool page.
 */
export function injectFaqSchema(
  faqs: FaqSchemaItem[],
  options: FaqSchemaOptions = {}
): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const scriptId = options.scriptId || DEFAULT_FAQ_SCHEMA_SCRIPT_ID;
  const toolId = options.toolId || 'tool';
  const pageUrl =
    options.pageUrl ||
    (options.toolId ? `${getProductionBaseUrl()}/${options.toolId}` : undefined);

  const schema = buildFaqSchemaJsonLd(faqs, pageUrl);
  const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!schema) {
    if (existing) {
      existing.remove();
    }
    return () => {};
  }

  const scriptElem = existing ?? document.createElement('script');
  scriptElem.id = scriptId;
  scriptElem.type = 'application/ld+json';
  scriptElem.setAttribute('data-tool', toolId);
  scriptElem.textContent = JSON.stringify(schema);

  if (!existing) {
    document.head.appendChild(scriptElem);
  }

  return () => {
    const current = document.getElementById(scriptId);
    if (current && current.getAttribute('data-tool') === toolId) {
      current.remove();
    }
  };
}
