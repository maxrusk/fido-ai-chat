import { File } from "@google-cloud/storage";

// File analyzer to extract content from different file formats
export class FileAnalyzer {
  
  // Extract text content from various file formats
  static async extractTextContent(file: File, fileName: string): Promise<string> {
    const extension = fileName.toLowerCase().split('.').pop();
    
    try {
      switch (extension) {
        case 'pdf':
          return await this.extractFromPDF(file);
        case 'doc':
        case 'docx':
          return await this.extractFromWord(file);
        case 'txt':
        case 'md':
          return await this.extractFromText(file);
        default:
          // Fallback to text extraction
          return await this.extractFromText(file);
      }
    } catch (error) {
      console.error(`Error extracting content from ${fileName}:`, error);
      // Fallback to raw text if specific parser fails
      return await this.extractFromText(file);
    }
  }

  // Extract content from PDF files
  static async extractFromPDF(file: File): Promise<string> {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      
      // Download file content as buffer
      const [buffer] = await file.download();
      
      // Parse PDF content
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  // Extract content from Word documents
  static async extractFromWord(file: File): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      
      // Download file content as buffer
      const [buffer] = await file.download();
      
      // Extract text from Word document
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Word document parsing error:', error);
      throw new Error('Failed to parse Word document');
    }
  }

  // Extract content from text files
  static async extractFromText(file: File): Promise<string> {
    try {
      const stream = file.createReadStream();
      
      return new Promise((resolve, reject) => {
        let content = '';
        stream.on('data', (chunk) => {
          content += chunk.toString('utf-8');
        });
        stream.on('end', () => {
          resolve(content);
        });
        stream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Text file parsing error:', error);
      throw new Error('Failed to parse text file');
    }
  }

  // Analyze business plan content and extract key sections
  static analyzeBusinessPlanContent(content: string): {
    summary: string;
    sections: Record<string, string>;
    keyInsights: string[];
  } {
    const sections: Record<string, string> = {};
    const keyInsights: string[] = [];
    
    // Common business plan section keywords
    const sectionKeywords = {
      'executive_summary': ['executive summary', 'overview', 'summary'],
      'business_description': ['business description', 'company description', 'about'],
      'market_analysis': ['market analysis', 'market research', 'industry analysis'],
      'products_services': ['products', 'services', 'offerings'],
      'marketing_plan': ['marketing', 'marketing plan', 'marketing strategy'],
      'operations': ['operations', 'operational plan', 'management'],
      'financial_projections': ['financial', 'projections', 'revenue', 'budget'],
      'funding_request': ['funding', 'investment', 'capital'],
      'appendix': ['appendix', 'attachments', 'supporting documents']
    };

    // Split content into paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    
    // Try to identify sections based on headers and keywords
    let currentSection = 'general';
    
    for (const paragraph of paragraphs) {
      const lowerParagraph = paragraph.toLowerCase();
      
      // Check if this paragraph starts a new section
      for (const [sectionKey, keywords] of Object.entries(sectionKeywords)) {
        if (keywords.some(keyword => lowerParagraph.includes(keyword))) {
          currentSection = sectionKey;
          break;
        }
      }
      
      // Add paragraph to current section
      if (!sections[currentSection]) {
        sections[currentSection] = '';
      }
      sections[currentSection] += paragraph + '\n\n';
    }

    // Extract key insights
    if (content.includes('revenue') || content.includes('profit')) {
      keyInsights.push('Contains financial projections');
    }
    if (content.includes('market') || content.includes('competition')) {
      keyInsights.push('Includes market analysis');
    }
    if (content.includes('funding') || content.includes('investment')) {
      keyInsights.push('Discusses funding requirements');
    }

    // Generate summary
    const summary = content.substring(0, 500) + (content.length > 500 ? '...' : '');

    return {
      summary,
      sections,
      keyInsights
    };
  }
}