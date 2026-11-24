import React, { createContext, useContext, useState, useEffect } from 'react';
import { trackLanguageSwitch } from './analytics';

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'ar';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  flag: string;
  shortLabel: string;
  dir?: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', shortLabel: 'EN', dir: 'ltr' },
  { code: 'es', name: 'Español', flag: '🇪🇸', shortLabel: 'ES', dir: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', shortLabel: 'FR', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', shortLabel: 'AR', dir: 'rtl' },
];

export const translations = {
  en: {
    // Brand & Header
    'brand.name': 'PDFQuick',
    'nav.allTools': 'All Tools',
    'nav.merge': 'Merge',
    'nav.split': 'Split',
    'nav.compress': 'Compress',
    'nav.imagesToPdf': 'Images to PDF',
    'nav.pdfToImages': 'PDF to Images',
    'nav.moreTools': 'More Tools',
    'nav.bankingFinance': 'Banking & Finance',
    'nav.rotate': 'Rotate PDF',
    'nav.deletePages': 'Delete Pages',
    'nav.reorderPages': 'Reorder Pages',
    'nav.pageNumbers': 'Page Numbers',
    'nav.watermark': 'Watermark PDF',
    'nav.ocrPdf': 'OCR PDF',
    'nav.about': 'About PDFQuick',
    'nav.privacy': 'Privacy & Local Processing',
    'nav.exploreTools': 'Explore All Tools',
    'header.privacyBadge': 'Client-Side · No Document Uploads',
    'header.language': 'Language',

    // Directory Search
    'tools.searchPlaceholder': 'Search PDF tools (e.g. rotate, watermark, US Letter, compress)...',
    'tools.searchClear': 'Clear search',
    'tools.noResults': 'No tools matched your search. Try keywords like "merge", "rotate", "watermark", or "compress".',
    'tools.cat.all': 'All Tools',
    'tools.cat.organize': 'Organize',
    'tools.cat.optimize': 'Optimize',
    'tools.cat.convert': 'Convert',
    'tools.cat.edit': 'Edit & Stamp',
    'tools.cat.banking': 'Banking & Finance',
    'banking.badge': 'US-First & Global · 100% In-Browser Processing',
    'banking.title': 'Banking & Finance PDF Tools',
    'banking.subtitle': 'Organize bank statements, financial packets, receipts, and helper worksheets locally inside your browser—with zero server uploads or credential requests.',
    'banking.statusActive': 'Active Tool',
    'banking.statusPlanned': 'Phase 2 Planned',
    'banking.optionalLogTitle': 'Optional Local Operation Counters',
    'banking.optionalLogDesc': 'Disabled by default. Never stores file names, bank accounts, or PDF contents.',
    'banking.optionalLogEnable': 'Enable local counters',
    'banking.optionalLogClear': 'Clear counters',
    'banking.formFillerTitle': 'Financial PDF Form Filler',
    'banking.formFillerButton': 'Generate & Preview Print-Ready PDF',
    'banking.privacyTitle': 'Financial Document Privacy & Redaction',
    'banking.privacyButton': 'Apply True Redaction & Scrub Metadata',
    'banking.paperLetter': 'US Letter (8.5 × 11 in)',
    'banking.paperA4': 'ISO A4 (210 × 297 mm)',

    // Dropzone
    'dropzone.dragActive': 'Drop your files right here...',
    'dropzone.clickToSelect': 'Choose files',
    'dropzone.orDrag': 'or drop documents here',
    'dropzone.sample': 'Try with a sample document',
    'dropzone.helper': 'Files remain strictly inside your browser. No files are uploaded to any server.',
    'dropzone.helperSingle': 'Drop a single PDF document here or click to browse.',
    'dropzone.sizeLimit': 'File size exceeds browser memory limit (250 MB).',
    'dropzone.invalidType': 'Unsupported file type. Please upload supported documents.',

    // Shared Progress Bar
    'progress.title': 'Processing your document...',
    'progress.processing': 'Working in local browser memory...',
    'progress.step': 'Step',
    'progress.of': 'of',
    'progress.local': 'Local processing',
    'progress.memoryNote': 'Processed strictly in device RAM',
    'progress.elapsed': 'Elapsed',

    // Tools Names & Actions
    'tool.merge.title': 'Merge PDF',
    'tool.merge.tagline': 'Combine multiple PDF files into one clean document quickly and privately.',
    'tool.merge.button': 'Merge PDFs Now',
    'tool.merge.addMore': 'Add more PDFs',
    'tool.merge.clearAll': 'Clear all',
    'tool.merge.minWarning': 'Please add at least 2 PDF documents to merge.',
    'tool.merge.successTitle': 'PDFs successfully merged!',

    'tool.split.title': 'Split PDF',
    'tool.split.tagline': 'Extract specific pages or separate a document into individual PDF files.',
    'tool.split.button': 'Split PDF Now',
    'tool.split.successTitle': 'PDF successfully split!',
    'tool.split.modeRange': 'Extract Custom Page Range',
    'tool.split.modeAll': 'Extract All Pages to ZIP',
    'tool.split.modeChunk': 'Split into Equal Groups',

    'tool.compress.title': 'Compress PDF',
    'tool.compress.tagline': 'Reduce PDF file size locally without uploading confidential papers to cloud servers.',
    'tool.compress.button': 'Compress PDF Now',
    'tool.compress.successTitle': 'PDF successfully compressed!',
    'tool.compress.reportTitle': 'PDF Optimization Report',
    'tool.compress.modeBalanced': 'Balanced (Recommended)',
    'tool.compress.modeMaximum': 'Maximum Compression',
    'tool.compress.modeLossless': 'Lossless Optimization',

    'tool.imagesToPdf.title': 'Images to PDF',
    'tool.imagesToPdf.tagline': 'Turn image files into clean, shareable PDF documents with custom page sizing.',
    'tool.imagesToPdf.button': 'Convert Images to PDF',
    'tool.imagesToPdf.successTitle': 'Images successfully converted to PDF!',

    'tool.pdfToImages.title': 'PDF to Images',
    'tool.pdfToImages.tagline': 'Extract each PDF page as a high-resolution PNG or JPEG picture with one-click ZIP download.',
    'tool.pdfToImages.button': 'Convert PDF Pages to Images',

    'tool.rotate.title': 'Rotate PDF',
    'tool.rotate.button': 'Rotate PDF Now',
    'tool.rotate.successTitle': 'PDF successfully rotated!',

    'tool.deletePages.title': 'Delete PDF Pages',
    'tool.deletePages.button': 'Delete Selected Pages',
    'tool.deletePages.successTitle': 'Pages successfully removed!',

    'tool.reorderPages.title': 'Reorder PDF Pages',
    'tool.reorderPages.button': 'Save Reordered PDF',
    'tool.reorderPages.successTitle': 'PDF pages reordered!',

    'tool.pageNumbers.title': 'Add Page Numbers',
    'tool.pageNumbers.button': 'Add Page Numbers Now',
    'tool.pageNumbers.successTitle': 'Page numbers added successfully!',

    'tool.watermark.title': 'Watermark PDF',
    'tool.watermark.button': 'Apply Watermark Now',
    'tool.watermark.successTitle': 'Watermark applied successfully!',

    'tool.ocrPdf.title': 'OCR PDF',
    'tool.ocrPdf.button': 'Recognize Text & Build Searchable PDF',
    'tool.ocrPdf.successTitle': 'Text recognition complete!',

    // Success Screen
    'success.ready': 'Your document is ready!',
    'success.downloadPdf': 'Download PDF File',
    'success.downloadZip': 'Download ZIP Archive',
    'success.processAnother': 'Process another file',
    'success.needMore': 'Need to do more?',
    'success.tryNext': 'Try {tool} next',
    'success.sizeReduction': 'Size reduction achieved:',
    'success.sizeDifference': 'Size difference:',
    'success.originalSize': 'Original file size:',
    'success.processedSize': 'Processed file size:',
    'success.pages': 'pages',
    'success.items': 'items',

    // Footer
    'footer.description': 'Fast, privacy-conscious online PDF utilities for US and international users. All document rendering, merging, splitting, and compression executes locally inside your web browser.',
    'footer.zeroStorage': 'Zero server document storage',
    'footer.pdfTools': 'PDF Tools',
    'footer.viewAll': 'View All Tools →',
    'footer.legal': 'Legal & Company',
    'footer.about': 'About PDFQuick',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Use',
    'footer.dmca': 'Copyright & DMCA Policy',
    'footer.contact': 'Contact & Support',
    'footer.browserNotice': 'Browser Processing',
    'footer.browserDetails': 'PDFQuick leverages modern browser capabilities to process documents locally on your device. We do not store or transmit your documents.',
    'footer.publicDeviceNotice': 'Security notice: If using a shared or public computer, always clear browser temporary cache or use private browsing mode when working with sensitive materials.',
    'footer.allRights': 'All rights reserved.',
  },

  es: {
    'brand.name': 'PDFQuick',
    'nav.allTools': 'Todas las herramientas',
    'nav.merge': 'Unir PDF',
    'nav.split': 'Dividir PDF',
    'nav.compress': 'Comprimir',
    'nav.imagesToPdf': 'Imágenes a PDF',
    'nav.pdfToImages': 'PDF a Imágenes',
    'nav.moreTools': 'Más herramientas',
    'nav.bankingFinance': 'Banca y Finanzas',
    'nav.rotate': 'Rotar PDF',
    'nav.deletePages': 'Eliminar páginas',
    'nav.reorderPages': 'Reordenar páginas',
    'nav.pageNumbers': 'Numerar páginas',
    'nav.watermark': 'Marca de agua',
    'nav.ocrPdf': 'OCR PDF',
    'nav.about': 'Acerca de PDFQuick',
    'nav.privacy': 'Privacidad y Procesamiento Local',
    'nav.exploreTools': 'Explorar todas las herramientas',
    'header.privacyBadge': 'En el navegador · Sin subir archivos',
    'header.language': 'Idioma',

    'tools.searchPlaceholder': 'Buscar herramientas PDF (ej. rotar, marca de agua, carta, comprimir)...',
    'tools.searchClear': 'Limpiar búsqueda',
    'tools.noResults': 'Ninguna herramienta coincide con tu búsqueda. Prueba con "rotar", "eliminar", "numerar" o "marca de agua".',
    'tools.cat.all': 'Todas',
    'tools.cat.organize': 'Organizar',
    'tools.cat.optimize': 'Optimizar',
    'tools.cat.convert': 'Convertir',
    'tools.cat.edit': 'Editar y Sellar',
    'tools.cat.banking': 'Banca y Finanzas',
    'banking.badge': 'EE. UU. y Global · Procesamiento 100% en Navegador',
    'banking.title': 'Herramientas PDF para Banca y Finanzas',
    'banking.subtitle': 'Organiza estados de cuenta bancarios, paquetes financieros y recibos localmente en tu navegador, sin subir archivos ni pedir credenciales.',
    'banking.statusActive': 'Herramienta Activa',
    'banking.statusPlanned': 'Fase 2 Planificada',
    'banking.optionalLogTitle': 'Contadores Locales Opcionales',
    'banking.optionalLogDesc': 'Desactivado por defecto. Nunca guarda nombres de archivo, cuentas ni contenido PDF.',
    'banking.optionalLogEnable': 'Activar contadores locales',
    'banking.optionalLogClear': 'Borrar contadores',
    'banking.formFillerTitle': 'Rellenador de Formularios Financieros PDF',
    'banking.formFillerButton': 'Generar y Previsualizar PDF Imprimible',
    'banking.privacyTitle': 'Privacidad y Censura Real de Documentos',
    'banking.privacyButton': 'Aplicar Censura Real y Limpiar Metadatos',
    'banking.paperLetter': 'Carta EE. UU. (8.5 × 11 pulg.)',
    'banking.paperA4': 'ISO A4 (210 × 297 mm)',

    'dropzone.dragActive': 'Suelta tus archivos aquí...',
    'dropzone.clickToSelect': 'Seleccionar archivos',
    'dropzone.orDrag': 'o arrastra tus documentos aquí',
    'dropzone.sample': 'Probar con un documento de ejemplo',
    'dropzone.helper': 'Tus archivos se procesan únicamente en tu navegador. Nada se sube a ningún servidor.',
    'dropzone.helperSingle': 'Arrastra un documento PDF aquí o haz clic para explorar.',
    'dropzone.sizeLimit': 'El tamaño excede el límite de memoria del navegador (250 MB).',
    'dropzone.invalidType': 'Tipo de archivo no compatible. Sube documentos compatibles.',

    'progress.title': 'Procesando tu documento...',
    'progress.processing': 'Trabajando en la memoria local de tu navegador...',
    'progress.step': 'Paso',
    'progress.of': 'de',
    'progress.local': 'Procesamiento local',
    'progress.memoryNote': 'Procesado estrictamente en la memoria RAM de tu dispositivo',
    'progress.elapsed': 'Transcurrido',

    'tool.merge.title': 'Unir PDF',
    'tool.merge.tagline': 'Combina múltiples archivos PDF en un solo documento organizado de forma rápida y privada.',
    'tool.merge.button': 'Unir archivos PDF ahora',
    'tool.merge.addMore': 'Añadir más PDFs',
    'tool.merge.clearAll': 'Borrar todo',
    'tool.merge.minWarning': 'Por favor agrega al menos 2 documentos PDF para unir.',
    'tool.merge.successTitle': '¡Archivos PDF unidos con éxito!',

    'tool.split.title': 'Dividir PDF',
    'tool.split.tagline': 'Extrae páginas específicas o separa tu documento en archivos PDF individuales.',
    'tool.split.button': 'Dividir PDF ahora',
    'tool.split.successTitle': '¡PDF dividido con éxito!',
    'tool.split.modeRange': 'Extraer rango de páginas',
    'tool.split.modeAll': 'Extraer todas las páginas a ZIP',
    'tool.split.modeChunk': 'Dividir en partes iguales',

    'tool.compress.title': 'Comprimir PDF',
    'tool.compress.tagline': 'Reduce el tamaño de tus PDF localmente sin subir documentos confidenciales a la nube.',
    'tool.compress.button': 'Comprimir PDF ahora',
    'tool.compress.successTitle': '¡PDF comprimido con éxito!',
    'tool.compress.reportTitle': 'Informe de optimización de PDF',
    'tool.compress.modeBalanced': 'Equilibrado (Recomendado)',
    'tool.compress.modeMaximum': 'Compresión máxima',
    'tool.compress.modeLossless': 'Optimización sin pérdida',

    'tool.imagesToPdf.title': 'Imágenes a PDF',
    'tool.imagesToPdf.tagline': 'Convierte imágenes en documentos PDF limpios con dimensiones de página personalizables.',
    'tool.imagesToPdf.button': 'Convertir imágenes a PDF',
    'tool.imagesToPdf.successTitle': '¡Imágenes convertidas a PDF con éxito!',

    'tool.pdfToImages.title': 'PDF a Imágenes',
    'tool.pdfToImages.tagline': 'Extrae cada página PDF como una imagen PNG o JPEG de alta resolución en un archivo ZIP.',
    'tool.pdfToImages.button': 'Convertir páginas a imágenes',

    'tool.rotate.title': 'Rotar PDF',
    'tool.rotate.button': 'Rotar PDF ahora',
    'tool.rotate.successTitle': '¡PDF rotado con éxito!',

    'tool.deletePages.title': 'Eliminar páginas PDF',
    'tool.deletePages.button': 'Eliminar páginas seleccionadas',
    'tool.deletePages.successTitle': '¡Páginas eliminadas con éxito!',

    'tool.reorderPages.title': 'Reordenar páginas PDF',
    'tool.reorderPages.button': 'Guardar PDF reordenado',
    'tool.reorderPages.successTitle': '¡Páginas reordenadas con éxito!',

    'tool.pageNumbers.title': 'Numerar páginas PDF',
    'tool.pageNumbers.button': 'Agregar números de página',
    'tool.pageNumbers.successTitle': '¡Números de página agregados!',

    'tool.watermark.title': 'Marca de agua PDF',
    'tool.watermark.button': 'Aplicar marca de agua',
    'tool.watermark.successTitle': '¡Marca de agua aplicada con éxito!',

    'tool.ocrPdf.title': 'OCR PDF',
    'tool.ocrPdf.button': 'Reconocer texto y crear PDF buscable',
    'tool.ocrPdf.successTitle': '¡Reconocimiento de texto completado!',

    'success.ready': '¡Tu documento está listo!',
    'success.downloadPdf': 'Descargar archivo PDF',
    'success.downloadZip': 'Descargar archivo ZIP',
    'success.processAnother': 'Procesar otro archivo',
    'success.needMore': '¿Necesitas hacer más?',
    'success.tryNext': 'Prueba {tool} a continuación',
    'success.sizeReduction': 'Reducción de tamaño lograda:',
    'success.sizeDifference': 'Diferencia de tamaño:',
    'success.originalSize': 'Tamaño original:',
    'success.processedSize': 'Tamaño procesado:',
    'success.pages': 'páginas',
    'success.items': 'elementos',

    'footer.description': 'Herramientas PDF en línea rápidas y privadas. Todo el procesamiento de renderizado, unión, división y compresión se ejecuta de forma 100% local en tu navegador.',
    'footer.zeroStorage': 'Cero almacenamiento en servidores',
    'footer.pdfTools': 'Herramientas PDF',
    'footer.viewAll': 'Ver todas las herramientas →',
    'footer.legal': 'Legal y Empresa',
    'footer.about': 'Acerca de PDFQuick',
    'footer.privacy': 'Política de Privacidad',
    'footer.terms': 'Términos de Uso',
    'footer.dmca': 'Política de Derechos de Autor y DMCA',
    'footer.contact': 'Contacto y Soporte',
    'footer.browserNotice': 'Procesamiento en Navegador',
    'footer.browserDetails': 'PDFQuick aprovecha capacidades modernas de tu navegador para procesar documentos de manera local. Nunca almacenamos ni transmitimos tus archivos.',
    'footer.publicDeviceNotice': 'Aviso de seguridad: Si usas una computadora compartida o pública, borra la memoria caché del navegador o utiliza el modo incógnito.',
    'footer.allRights': 'Todos los derechos reservados.',
  },

  fr: {
    'brand.name': 'PDFQuick',
    'nav.allTools': 'Tous les outils',
    'nav.merge': 'Fusionner',
    'nav.split': 'Diviser',
    'nav.compress': 'Compresser',
    'nav.imagesToPdf': 'Images en PDF',
    'nav.pdfToImages': 'PDF en Images',
    'nav.moreTools': 'Plus d’outils',
    'nav.bankingFinance': 'Banque & Finance',
    'nav.rotate': 'Pivoter PDF',
    'nav.deletePages': 'Supprimer des pages',
    'nav.reorderPages': 'Réorganiser les pages',
    'nav.pageNumbers': 'Numéroter les pages',
    'nav.watermark': 'Filigrane PDF',
    'nav.ocrPdf': 'OCR PDF',
    'nav.about': 'À propos de PDFQuick',
    'nav.privacy': 'Confidentialité et Traitement Local',
    'nav.exploreTools': 'Découvrir tous les outils',
    'header.privacyBadge': 'Côté client · Aucun document téléversé',
    'header.language': 'Langue',

    'tools.searchPlaceholder': 'Rechercher un outil PDF (ex. pivoter, filigrane, numéroter, compresser)...',
    'tools.searchClear': 'Effacer la recherche',
    'tools.noResults': 'Aucun outil ne correspond à votre recherche. Essayez « pivoter », « supprimer », « filigrane » ou « fusionner ».',
    'tools.cat.all': 'Tous les outils',
    'tools.cat.organize': 'Organiser',
    'tools.cat.optimize': 'Optimiser',
    'tools.cat.convert': 'Convertir',
    'tools.cat.edit': 'Éditer & Tamponner',
    'tools.cat.banking': 'Banque & Finance',
    'banking.badge': 'États-Unis & International · 100% Local dans le Navigateur',
    'banking.title': 'Outils PDF Banque & Finance',
    'banking.subtitle': 'Organisez vos relevés bancaires, dossiers financiers et reçus localement dans votre navigateur, sans aucun téléversement serveur ni identifiant bancaire.',
    'banking.statusActive': 'Outil Actif',
    'banking.statusPlanned': 'Phase 2 Prévue',
    'banking.optionalLogTitle': 'Compteurs Locaux Optionnels',
    'banking.optionalLogDesc': 'Désactivé par défaut. Ne stocke jamais de noms de fichiers, de comptes ou de contenu PDF.',
    'banking.optionalLogEnable': 'Activer les compteurs locaux',
    'banking.optionalLogClear': 'Effacer les compteurs',
    'banking.formFillerTitle': 'Remplisseur de Formulaires Financiers PDF',
    'banking.formFillerButton': 'Générer et Aperçu du PDF Imprimable',
    'banking.privacyTitle': 'Confidentialité et Biffure Réelle PDF',
    'banking.privacyButton': 'Appliquer la Biffure Réelle & Purger Métadonnées',
    'banking.paperLetter': 'US Letter (8,5 × 11 po)',
    'banking.paperA4': 'ISO A4 (210 × 297 mm)',

    'dropzone.dragActive': 'Déposez vos fichiers ici...',
    'dropzone.clickToSelect': 'Sélectionner des fichiers',
    'dropzone.orDrag': 'ou glissez-déposez vos documents ici',
    'dropzone.sample': 'Essayer avec un document exemple',
    'dropzone.helper': 'Vos fichiers restent strictement dans votre navigateur. Aucun fichier n’est envoyé à un serveur.',
    'dropzone.helperSingle': 'Glissez un document PDF ici ou cliquez pour parcourir.',
    'dropzone.sizeLimit': 'La taille dépasse la mémoire maximale du navigateur (250 Mo).',
    'dropzone.invalidType': 'Type de fichier non supporté. Veuillez importer des formats compatibles.',

    'progress.title': 'Traitement de votre document...',
    'progress.processing': 'Exécution dans la mémoire locale de votre navigateur...',
    'progress.step': 'Étape',
    'progress.of': 'sur',
    'progress.local': 'Traitement local',
    'progress.memoryNote': 'Traité strictement dans la RAM de votre appareil',
    'progress.elapsed': 'Écoulé',

    'tool.merge.title': 'Fusionner PDF',
    'tool.merge.tagline': 'Combinez plusieurs fichiers PDF en un seul document propre, rapidement et en toute confidentialité.',
    'tool.merge.button': 'Fusionner les PDF',
    'tool.merge.addMore': 'Ajouter d’autres PDF',
    'tool.merge.clearAll': 'Tout effacer',
    'tool.merge.minWarning': 'Veuillez ajouter au moins 2 documents PDF à fusionner.',
    'tool.merge.successTitle': 'PDFs fusionnés avec succès !',

    'tool.split.title': 'Diviser PDF',
    'tool.split.tagline': 'Extrayez des pages spécifiques ou séparez un document en fichiers PDF individuels.',
    'tool.split.button': 'Diviser le PDF',
    'tool.split.successTitle': 'PDF divisé avec succès !',
    'tool.split.modeRange': 'Extraire une plage de pages',
    'tool.split.modeAll': 'Extraire toutes les pages en ZIP',
    'tool.split.modeChunk': 'Diviser en parties égales',

    'tool.compress.title': 'Compresser PDF',
    'tool.compress.tagline': 'Réduisez la taille de votre PDF localement sans téléverser vos documents vers le cloud.',
    'tool.compress.button': 'Compresser le PDF',
    'tool.compress.successTitle': 'PDF compressé avec succès !',
    'tool.compress.reportTitle': 'Rapport d’optimisation du PDF',
    'tool.compress.modeBalanced': 'Équilibré (Recommandé)',
    'tool.compress.modeMaximum': 'Compression maximale',
    'tool.compress.modeLossless': 'Optimisation sans perte',

    'tool.imagesToPdf.title': 'Images en PDF',
    'tool.imagesToPdf.tagline': 'Transformez vos images en documents PDF prêts à partager avec dimensions personnalisées.',
    'tool.imagesToPdf.button': 'Convertir les images en PDF',
    'tool.imagesToPdf.successTitle': 'Images converties en PDF avec succès !',

    'tool.pdfToImages.title': 'PDF en Images',
    'tool.pdfToImages.tagline': 'Extrayez chaque page PDF sous forme d’images PNG ou JPEG haute résolution dans une archive ZIP.',
    'tool.pdfToImages.button': 'Convertir les pages en images',

    'tool.rotate.title': 'Pivoter PDF',
    'tool.rotate.button': 'Pivoter le PDF',
    'tool.rotate.successTitle': 'PDF pivoté avec succès !',

    'tool.deletePages.title': 'Supprimer des pages PDF',
    'tool.deletePages.button': 'Supprimer les pages sélectionnées',
    'tool.deletePages.successTitle': 'Pages supprimées avec succès !',

    'tool.reorderPages.title': 'Réorganiser les pages PDF',
    'tool.reorderPages.button': 'Enregistrer le PDF réorganisé',
    'tool.reorderPages.successTitle': 'Pages réorganisées avec succès !',

    'tool.pageNumbers.title': 'Numéroter les pages PDF',
    'tool.pageNumbers.button': 'Ajouter les numéros de page',
    'tool.pageNumbers.successTitle': 'Numéros de page ajoutés !',

    'tool.watermark.title': 'Filigrane PDF',
    'tool.watermark.button': 'Appliquer le filigrane',
    'tool.watermark.successTitle': 'Filigrane appliqué avec succès !',

    'tool.ocrPdf.title': 'OCR PDF',
    'tool.ocrPdf.button': 'Extraire le texte et créer un PDF indexable',
    'tool.ocrPdf.successTitle': 'Reconnaissance de texte terminée !',

    'success.ready': 'Votre document est prêt !',
    'success.downloadPdf': 'Télécharger le fichier PDF',
    'success.downloadZip': 'Télécharger l’archive ZIP',
    'success.processAnother': 'Traiter un autre document',
    'success.needMore': 'Besoin de faire plus ?',
    'success.tryNext': 'Essayez {tool} ensuite',
    'success.sizeReduction': 'Réduction de taille obtenue :',
    'success.sizeDifference': 'Différence de taille :',
    'success.originalSize': 'Taille originale :',
    'success.processedSize': 'Taille traitée :',
    'success.pages': 'pages',
    'success.items': 'éléments',

    'footer.description': 'Outils PDF en ligne rapides et confidentiels. Tous les traitements de rendu, fusion, division et compression s’exécutent localement dans votre navigateur web.',
    'footer.zeroStorage': 'Zéro stockage sur serveur',
    'footer.pdfTools': 'Outils PDF',
    'footer.viewAll': 'Voir tous les outils →',
    'footer.legal': 'Informations légales',
    'footer.about': 'À propos de PDFQuick',
    'footer.privacy': 'Politique de confidentialité',
    'footer.terms': 'Conditions d’utilisation',
    'footer.dmca': 'Politique Droits d’auteur et DMCA',
    'footer.contact': 'Contact et Support',
    'footer.browserNotice': 'Traitement dans le navigateur',
    'footer.browserDetails': 'PDFQuick exploite les capacités modernes de votre navigateur pour traiter vos fichiers sur votre appareil. Nous ne stockons ni ne transmettons vos documents.',
    'footer.publicDeviceNotice': 'Avis de sécurité : Sur un ordinateur public ou partagé, veillez à effacer le cache ou à utiliser la navigation privée.',
    'footer.allRights': 'Tous droits réservés.',
  },

  ar: {
    'brand.name': 'PDFQuick',
    'nav.allTools': 'جميع الأدوات',
    'nav.merge': 'دمج PDF',
    'nav.split': 'تقسيم PDF',
    'nav.compress': 'ضغط PDF',
    'nav.imagesToPdf': 'صور إلى PDF',
    'nav.pdfToImages': 'PDF إلى صور',
    'nav.moreTools': 'أدوات إضافية',
    'nav.bankingFinance': 'البنوك والمالية',
    'nav.rotate': 'تدوير PDF',
    'nav.deletePages': 'حذف صفحات',
    'nav.reorderPages': 'ترتيب الصفحات',
    'nav.pageNumbers': 'ترقيم الصفحات',
    'nav.watermark': 'علامة مائية',
    'nav.ocrPdf': 'استخراج النص (OCR)',
    'nav.about': 'عن PDFQuick',
    'nav.privacy': 'الخصوصية والمعالجة المحلية',
    'nav.exploreTools': 'استكشاف جميع الأدوات',
    'header.privacyBadge': 'داخل المتصفح · بدون رفع مستندات',
    'header.language': 'اللغة',

    'tools.searchPlaceholder': 'ابحث في أدوات PDF (مثل: تدوير، حذف، ترقيم، علامة مائية، ضغط)...',
    'tools.searchClear': 'مسح البحث',
    'tools.noResults': 'لم يتم العثور على أداة مطابقة لبحثك. جرّب كلمات مثل "تدوير" أو "حذف" أو "ترقيم" أو "علامة مائية".',
    'tools.cat.all': 'جميع الأدوات',
    'tools.cat.organize': 'تنظيم',
    'tools.cat.optimize': 'تحسين',
    'tools.cat.convert': 'تحويل',
    'tools.cat.edit': 'تحرير وختم',
    'tools.cat.banking': 'البنوك والمالية',
    'banking.badge': 'السوق الأمريكي والعالمي · معالجة محلية 100%',
    'banking.title': 'أدوات PDF للبنوك والمالية',
    'banking.subtitle': 'نظّم كشوف الحسابات البنكية والملفات المالية والفواتير محلياً داخل متصفحك دون رفع أي مستند أو طلب بيانات دخول بنكية.',
    'banking.statusActive': 'أداة مفعّلة',
    'banking.statusPlanned': 'مخطط للمرحلة الثانية',
    'banking.optionalLogTitle': 'سجل إحصائيات محلي اختياري',
    'banking.optionalLogDesc': 'معطّل افتراضياً. لا يحفظ أسماء الملفات أو الحسابات البنكية أو محتوى المستندات مطلقاً.',
    'banking.optionalLogEnable': 'تفعيل الإحصائيات المحلية',
    'banking.optionalLogClear': 'مسح السجل',
    'banking.formFillerTitle': 'تعبئة النماذج المالية PDF',
    'banking.formFillerButton': 'إنشاء ومعاينة PDF جاهز للطباعة',
    'banking.privacyTitle': 'حماية خصوصية المستندات المالية والحذف الآمن',
    'banking.privacyButton': 'تطبيق الحذف الفعلي ومسح البيانات الوصفية',
    'banking.paperLetter': 'مقاس US Letter (8.5 × 11 إنش)',
    'banking.paperA4': 'مقاس A4 قياسي (210 × 297 مم)',

    'dropzone.dragActive': 'أفلت ملفاتك هنا مباشرة...',
    'dropzone.clickToSelect': 'اختيار الملفات',
    'dropzone.orDrag': 'أو اسحب وأفلت المستندات هنا',
    'dropzone.sample': 'تجربة مستند نموذجي',
    'dropzone.helper': 'تبقى ملفاتك بالكامل داخل متصفحك. لا يتم رفع أي ملف إلى أي خادم خارجي.',
    'dropzone.helperSingle': 'أفلت مستند PDF واحداً هنا أو انقر للتصفح.',
    'dropzone.sizeLimit': 'حجم الملف يتجاوز حد ذاكرة المتصفح (250 ميغابايت).',
    'dropzone.invalidType': 'نوع الملف غير مدعوم. يرجى اختيار ملفات متوافقة.',

    'progress.title': 'جارٍ معالجة المستند...',
    'progress.processing': 'تتم المعالجة داخل ذاكرة المتصفح المحلية...',
    'progress.step': 'خطوة',
    'progress.of': 'من',
    'progress.local': 'معالجة محلية',
    'progress.memoryNote': 'تتم المعالجة بالكامل في ذاكرة جهازك العشوائية (RAM)',
    'progress.elapsed': 'الوقت المنقضي',

    'tool.merge.title': 'دمج ملفات PDF',
    'tool.merge.tagline': 'اجمع عدة ملفات PDF في مستند واحد منظم بسرعة وخصوصية تامة.',
    'tool.merge.button': 'دمج ملفات PDF الآن',
    'tool.merge.addMore': 'إضافة المزيد من الملفات',
    'tool.merge.clearAll': 'مسح الكل',
    'tool.merge.minWarning': 'يرجى إضافة ملفي PDF على الأقل للدمج.',
    'tool.merge.successTitle': 'تم دمج ملفات PDF بنجاح!',

    'tool.split.title': 'تقسيم PDF',
    'tool.split.tagline': 'استخرج صفحات محددة أو قسّم المستند إلى ملفات PDF مستقلة.',
    'tool.split.button': 'تقسيم PDF الآن',
    'tool.split.successTitle': 'تم تقسيم ملف PDF بنجاح!',
    'tool.split.modeRange': 'استخراج نطاق صفحات مخصص',
    'tool.split.modeAll': 'استخراج كافة الصفحات في ملف مضغوط (ZIP)',
    'tool.split.modeChunk': 'تقسيم إلى مجموعات متساوية',

    'tool.compress.title': 'ضغط PDF',
    'tool.compress.tagline': 'قلل حجم ملف PDF محلياً دون رفع أوراقك ومستنداتك السرية إلى السحابة.',
    'tool.compress.button': 'ضغط ملف PDF الآن',
    'tool.compress.successTitle': 'تم ضغط ملف PDF بنجاح!',
    'tool.compress.reportTitle': 'تقرير تحسين حجم PDF',
    'tool.compress.modeBalanced': 'متوازن (موصى به)',
    'tool.compress.modeMaximum': 'أقصى ضغط',
    'tool.compress.modeLossless': 'تحسين غير فاقد للجودة',

    'tool.imagesToPdf.title': 'تحويل الصور إلى PDF',
    'tool.imagesToPdf.tagline': 'حول الصور إلى مستند PDF عالي الجودة مع تخصيص أبعاد وهوامش الصفحات.',
    'tool.imagesToPdf.button': 'تحويل الصور إلى PDF',
    'tool.imagesToPdf.successTitle': 'تم تحويل الصور إلى PDF بنجاح!',

    'tool.pdfToImages.title': 'تحويل PDF إلى صور',
    'tool.pdfToImages.tagline': 'استخرج كل صفحة PDF كصورة PNG أو JPEG عالية الدقة مع تحميل مضغوط (ZIP).',
    'tool.pdfToImages.button': 'تحويل صفحات PDF إلى صور',

    'tool.rotate.title': 'تدوير صفحات PDF',
    'tool.rotate.button': 'تدوير الملف الآن',
    'tool.rotate.successTitle': 'تم تدوير صفحات PDF بنجاح!',

    'tool.deletePages.title': 'حذف صفحات PDF',
    'tool.deletePages.button': 'حذف الصفحات المحددة',
    'tool.deletePages.successTitle': 'تم حذف الصفحات المحددة بنجاح!',

    'tool.reorderPages.title': 'إعادة ترتيب صفحات PDF',
    'tool.reorderPages.button': 'حفظ الترتيب الجديد',
    'tool.reorderPages.successTitle': 'تم إعادة ترتيب صفحات PDF بنجاح!',

    'tool.pageNumbers.title': 'إضافة أرقام الصفحات',
    'tool.pageNumbers.button': 'إضافة الترقيم الآن',
    'tool.pageNumbers.successTitle': 'تمت إضافة أرقام الصفحات بنجاح!',

    'tool.watermark.title': 'إضافة علامة مائية PDF',
    'tool.watermark.button': 'تطبيق العلامة المائية',
    'tool.watermark.successTitle': 'تمت إضافة العلامة المائية بنجاح!',

    'tool.ocrPdf.title': 'استخراج النص من PDF (OCR)',
    'tool.ocrPdf.button': 'التعرف على النص وإنشاء PDF قابل للبحث',
    'tool.ocrPdf.successTitle': 'تم التعرف على النص بنجاح!',

    'success.ready': 'مستندك جاهز للتحميل!',
    'success.downloadPdf': 'تحميل ملف PDF',
    'success.downloadZip': 'تحميل أرشيف ZIP',
    'success.processAnother': 'معالجة ملف آخر',
    'success.needMore': 'هل تحتاج للمزيد؟',
    'success.tryNext': 'جرّب {tool} بعد ذلك',
    'success.sizeReduction': 'نسبة تقليل الحجم:',
    'success.sizeDifference': 'فرق الحجم:',
    'success.originalSize': 'الحجم الأصلي:',
    'success.processedSize': 'الحجم بعد المعالجة:',
    'success.pages': 'صفحات',
    'success.items': 'عناصر',

    'footer.description': 'أدوات PDF سريعة وآمنة تماماً عبر الإنترنت للمستخدمين حول العالم. تتم جميع عمليات المعالجة والدمج والتقسيم والضغط محلياً داخل متصفحك.',
    'footer.zeroStorage': 'بدون أي تخزين على خوادم خارجية',
    'footer.pdfTools': 'أدوات PDF',
    'footer.viewAll': 'عرض جميع الأدوات ←',
    'footer.legal': 'المعلومات القانونية',
    'footer.about': 'عن PDFQuick',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.terms': 'شروط الاستخدام',
    'footer.dmca': 'حقوق النشر وسياسة DMCA',
    'footer.contact': 'الاتصال والدعم',
    'footer.browserNotice': 'معالجة مباشرة داخل المتصفح',
    'footer.browserDetails': 'تستفيد PDFQuick من تقنيات المتصفح الحديثة لمعالجة الملفات على جهازك محلياً دون إرسالها أو تخزينها.',
    'footer.publicDeviceNotice': 'تنبيه أمان: إذا كنت تستخدم حاسوباً عاماً أو مشتركاً، احرص على مسح ملفات التنزيل واستخدام التصفح الخفي.',
    'footer.allRights': 'جميع الحقوق محفوظة.',
  },
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKey | string, params?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  dir: 'ltr',
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      const saved = localStorage.getItem('pdfquick_lang') as SupportedLanguage;
      if (saved && (saved === 'en' || saved === 'es' || saved === 'fr' || saved === 'ar')) {
        return saved;
      }
      const navLang = navigator.language?.toLowerCase() || '';
      if (navLang.startsWith('es')) return 'es';
      if (navLang.startsWith('fr')) return 'fr';
      if (navLang.startsWith('ar')) return 'ar';
    } catch {
      // ignore
    }
    return 'en';
  });

  const currentOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const dir = currentOption.dir || 'ltr';

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('pdfquick_lang', newLang);
      const opt = LANGUAGES.find((l) => l.code === newLang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLang;
        document.documentElement.dir = opt?.dir || 'ltr';
      }
      trackLanguageSwitch(newLang);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = dir;
    }
  }, [language, dir]);

  const t = (key: TranslationKey | string, params?: Record<string, string | number>): string => {
    const langDict = (translations as any)[language] || translations.en;
    let text = langDict[key] || (translations.en as any)[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
