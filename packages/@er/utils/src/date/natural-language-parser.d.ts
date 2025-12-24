export interface ParsedDateTime {
    date: Date;
    isValid: boolean;
    originalText: string;
    confidence: 'high' | 'medium' | 'low';
}
export declare function parseNaturalLanguageDateTime(text: string, referenceDate?: Date): ParsedDateTime;
//# sourceMappingURL=natural-language-parser.d.ts.map