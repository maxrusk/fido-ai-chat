import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

// PDF processing configuration
const PDF_PROCESSING_ENABLED = process.env.ENABLE_PDF_PROCESSING !== 'false';
let pdfParse: any = null;
let pdfParseInitialized = false;
let pdfParseError: string | null = null;

async function initializePdfParse(): Promise<boolean> {
  if (pdfParseInitialized) {
    return pdfParse !== null;
  }

  pdfParseInitialized = true;

  if (!PDF_PROCESSING_ENABLED) {
    console.log('PDF processing is disabled via ENABLE_PDF_PROCESSING environment variable');
    pdfParseError = 'PDF processing disabled via configuration';
    return false;
  }

  try {
    console.log('Initializing pdf-parse module...');
    const pdfParseModule = await import('pdf-parse');
    pdfParse = pdfParseModule.default || pdfParseModule;
    console.log('PDF parsing module loaded successfully');
    return true;
  } catch (error: any) {
    console.warn('Failed to load pdf-parse module:', error.message);
    pdfParseError = `PDF parsing unavailable: ${error.message}`;
    
    // In production, log but don't crash the application
    if (process.env.NODE_ENV === 'production') {
      console.warn('PDF processing will be disabled in production due to module loading issues');
    }
    
    return false;
  }
}

async function getPdfParse() {
  const isAvailable = await initializePdfParse();
  
  if (!isAvailable) {
    throw new Error(pdfParseError || 'PDF processing is not available');
  }
  
  return pdfParse;
}

export interface ProcessedDocument {
  text: string;
  tables: any[];
  metadata: {
    title?: string;
    pages?: number;
    wordCount: number;
    hasFinancialData: boolean;
  };
}

export class DocumentProcessor {
  // Check if PDF processing is available without throwing errors
  async isPdfProcessingAvailable(): Promise<boolean> {
    return await initializePdfParse();
  }
  
  // Get PDF processing status for health checks
  getPdfProcessingStatus(): { available: boolean; error?: string } {
    if (!pdfParseInitialized) {
      return { available: false, error: 'PDF processing not yet initialized' };
    }
    
    return {
      available: pdfParse !== null,
      error: pdfParseError || undefined
    };
  }

  async processDocument(filePath: string, fileType: string): Promise<ProcessedDocument> {
    try {
      switch (fileType) {
        case 'application/pdf':
          return await this.processPDF(filePath);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.processWord(filePath);
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel':
          return await this.processExcel(filePath);
        case 'text/plain':
          return await this.processText(filePath);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error: any) {
      console.error(`Error processing document ${filePath}:`, error);
      
      // For PDF processing errors in production, provide a more helpful error message
      if (fileType === 'application/pdf' && process.env.NODE_ENV === 'production') {
        console.warn('PDF processing failed in production environment, this may be due to deployment constraints');
        return {
          text: '[PDF processing is currently unavailable in this deployment environment. Please try again later or use a different file format.]',
          tables: [],
          metadata: {
            wordCount: 0,
            hasFinancialData: false
          }
        };
      }
      
      throw new Error(`Failed to process document: ${error?.message || 'Unknown error'}`);
    }
  }

  private async processPDF(filePath: string): Promise<ProcessedDocument> {
    try {
      const pdf = await getPdfParse();
      const buffer = await readFile(filePath);
      const data = await pdf(buffer);
      
      const wordCount = data.text.split(/\s+/).length;
      const hasFinancialData = this.detectFinancialData(data.text);
      
      return {
        text: data.text,
        tables: [], // PDF table extraction would require additional libraries
        metadata: {
          title: data.info?.Title,
          pages: data.numpages,
          wordCount,
          hasFinancialData
        }
      };
    } catch (error: any) {
      console.error('PDF processing failed:', error);
      
      // Enhanced fallback: Create a helpful error message for AI analysis
      const errorMessage = error?.message || 'Unknown error';
      const fallbackText = this.generatePDFFallbackContent(filePath, errorMessage);
      
      return {
        text: fallbackText,
        tables: [],
        metadata: {
          wordCount: fallbackText.split(/\s+/).length,
          hasFinancialData: false
        }
      };
    }
  }
  
  private generatePDFFallbackContent(filePath: string, errorMessage: string): string {
    const fileName = filePath.split('/').pop() || 'document.pdf';
    
    return `
PDF Processing Notice: This document could not be fully processed due to technical limitations in the current deployment environment.

Document: ${fileName}
Issue: ${errorMessage}

For the best analysis experience, please consider:
1. Converting your PDF to a Word document (.docx) or text file (.txt) and re-uploading
2. Copying and pasting the content directly into the chat
3. Using a different format if possible

Despite this limitation, I can still provide strategic business guidance based on:
- Your business description and goals
- Market analysis discussions
- Financial planning conversations
- Any additional context you provide

Please describe your business plan or specific areas where you'd like strategic guidance, and I'll provide comprehensive analysis and recommendations based on that information.
    `.trim();
  }

  private async processWord(filePath: string): Promise<ProcessedDocument> {
    const buffer = await readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    
    const wordCount = result.value.split(/\s+/).length;
    const hasFinancialData = this.detectFinancialData(result.value);
    
    return {
      text: result.value,
      tables: [], // Mammoth can extract tables but requires more setup
      metadata: {
        wordCount,
        hasFinancialData
      }
    };
  }

  private async processExcel(filePath: string): Promise<ProcessedDocument> {
    const buffer = await readFile(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    let text = '';
    const tables: any[] = [];
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      tables.push({
        sheetName,
        data: jsonData
      });
      
      // Convert to text for AI analysis
      const sheetText = jsonData.map(row => 
        Array.isArray(row) ? row.join('\t') : ''
      ).join('\n');
      
      text += `\n=== ${sheetName} ===\n${sheetText}\n`;
    });
    
    const wordCount = text.split(/\s+/).length;
    const hasFinancialData = this.detectFinancialData(text) || tables.length > 0;
    
    return {
      text,
      tables,
      metadata: {
        wordCount,
        hasFinancialData
      }
    };
  }

  private async processText(filePath: string): Promise<ProcessedDocument> {
    const buffer = await readFile(filePath);
    const text = buffer.toString('utf-8');
    
    const wordCount = text.split(/\s+/).length;
    const hasFinancialData = this.detectFinancialData(text);
    
    return {
      text,
      tables: [],
      metadata: {
        wordCount,
        hasFinancialData
      }
    };
  }

  private detectFinancialData(text: string): boolean {
    const financialKeywords = [
      'revenue', 'profit', 'cash flow', 'expenses', 'budget',
      'financial projections', 'income statement', 'balance sheet',
      'break-even', 'roi', 'gross margin', 'net income',
      'funding', 'investment', 'valuation', 'equity',
      'debt', 'loan', 'capital', 'assets', 'liabilities',
      '$', 'USD', 'million', 'thousand', 'K', 'M', 'B'
    ];
    
    const lowercaseText = text.toLowerCase();
    return financialKeywords.some(keyword => 
      lowercaseText.includes(keyword.toLowerCase())
    );
  }

  extractFinancialMetrics(text: string): any {
    // Extract common financial metrics using regex patterns
    const metrics = {
      revenue: this.extractMonetaryValues(text, ['revenue', 'sales', 'income']),
      expenses: this.extractMonetaryValues(text, ['expenses', 'costs', 'spending']),
      profit: this.extractMonetaryValues(text, ['profit', 'net income', 'earnings']),
      cashFlow: this.extractMonetaryValues(text, ['cash flow', 'cash']),
      funding: this.extractMonetaryValues(text, ['funding', 'investment', 'capital raise']),
    };
    
    return metrics;
  }

  private extractMonetaryValues(text: string, keywords: string[]): number[] {
    const values: number[] = [];
    
    keywords.forEach(keyword => {
      // Regex to find monetary values near keywords
      const regex = new RegExp(
        `${keyword}[^$]*\\$([\\d,]+(?:\\.\\d{2})?)(?:[kKmMbB])?`,
        'gi'
      );
      
      let match;
      while ((match = regex.exec(text)) !== null) {
        let value = parseFloat(match[1].replace(/,/g, ''));
        
        // Handle K, M, B suffixes
        const suffix = match[0].slice(-1).toLowerCase();
        if (suffix === 'k') value *= 1000;
        else if (suffix === 'm') value *= 1000000;
        else if (suffix === 'b') value *= 1000000000;
        
        values.push(value);
      }
    });
    
    return values;
  }
}