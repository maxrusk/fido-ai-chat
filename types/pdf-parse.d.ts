declare module 'pdf-parse' {
  interface PDFInfo {
    Title?: string;
    Author?: string;
    Subject?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: Date;
    ModDate?: Date;
  }

  interface PDFResult {
    numpages: number;
    text: string;
    info: PDFInfo;
    metadata?: any;
  }

  function parse(buffer: Buffer, options?: any): Promise<PDFResult>;
  export = parse;
}