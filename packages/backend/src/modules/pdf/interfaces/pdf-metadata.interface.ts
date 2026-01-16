export interface PdfMetadata {
  pageCount: number;
  title?: string;
  author?: string;
  creationDate?: Date;
  modificationDate?: Date;
  format?: string;
  encrypted: boolean;
  fileSize: number;
}

export interface PdfExtractionResult {
  text: string;
  metadata: PdfMetadata;
  pages: Array<{
    pageNumber: number;
    text: string;
  }>;
}
