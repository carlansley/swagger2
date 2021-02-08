import type { Document } from './schema';
export declare function validateDocument(document: unknown): Document | undefined;
export declare function loadDocumentSync(file: string): unknown;
