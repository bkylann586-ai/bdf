declare module 'arabic-reshaper' {
  const ArabicReshaper: {
    convertArabic(text: string): string;
    convertArabicBack?(text: string): string;
  };
  export default ArabicReshaper;
}

declare module 'bidi-js' {
  interface BidiInstance {
    getEmbeddingLevels(string: string, baseDirection?: 'ltr' | 'rtl' | 'auto'): {
      paragraphs: Array<{ start: number; end: number; level: number }>;
      levels: Uint8Array;
    };
    getReorderedIndices(string: string, embeddingLevelsResult: any): number[];
    getMirroredCharactersMap(string: string, embeddingLevelsResult: any): Map<number, string>;
    getReorderedString(string: string, embeddingLevelsResult: any): string;
    getBidiCharTypeName?(char: string): string;
  }
  function bidiFactory(): BidiInstance;
  export default bidiFactory;
}
