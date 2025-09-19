/**
 * Business Plan Content Extractor
 * 
 * Automatically detects, extracts, and structures business plan content
 * from AI responses and saves it to the database for easy retrieval.
 */

import type { ChatMessage } from "@shared/schema";

export interface BusinessPlanSection {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  lastUpdated: string;
  aiGenerated: boolean;
}

export interface ExtractedBusinessPlan {
  sections: Record<string, BusinessPlanSection>;
  title?: string;
  businessName?: string;
  completionPercentage: number;
}

export class BusinessPlanExtractor {
  private static readonly BUSINESS_PLAN_SECTIONS = [
    'executive_summary',
    'business_description', 
    'market_analysis',
    'products_services',
    'marketing_plan',
    'operations_plan',
    'financial_projections',
    'funding_request',
    'owner_bio'
  ];

  private static readonly SECTION_KEYWORDS = {
    executive_summary: ['executive summary', 'overview', 'business summary', 'company overview'],
    business_description: ['business description', 'company description', 'business concept', 'what we do'],
    market_analysis: ['market analysis', 'target market', 'market research', 'industry analysis', 'competitive analysis'],
    products_services: ['products', 'services', 'offerings', 'product line', 'service offerings'],
    marketing_plan: ['marketing plan', 'marketing strategy', 'sales strategy', 'promotion', 'advertising'],
    operations_plan: ['operations', 'operational plan', 'business operations', 'day-to-day operations'],
    financial_projections: ['financial projections', 'financials', 'revenue projections', 'profit and loss', 'cash flow'],
    funding_request: ['funding request', 'capital requirements', 'investment needed', 'financing'],
    owner_bio: ['management team', 'founder', 'owner', 'leadership', 'key personnel', 'about the founder']
  };

  /**
   * Detects if an AI response contains business plan content
   */
  static containsBusinessPlanContent(content: string): boolean {
    const lowerContent = content.toLowerCase();
    
    // Check for business plan indicators
    const businessPlanIndicators = [
      'business plan',
      'executive summary',
      'market analysis', 
      'financial projections',
      'marketing strategy',
      'business model',
      'revenue streams',
      'target market',
      'competitive advantage',
      'funding requirements'
    ];

    // Must have at least 2 indicators and substantial content
    const indicatorCount = businessPlanIndicators.filter(indicator => 
      lowerContent.includes(indicator)
    ).length;

    return indicatorCount >= 2 && content.length > 200;
  }

  /**
   * Extracts structured business plan content from AI response
   */
  static extractBusinessPlanContent(content: string): ExtractedBusinessPlan {
    const sections: Record<string, BusinessPlanSection> = {};
    let businessName: string | undefined;
    let title: string | undefined;

    // Extract business name from common patterns
    const businessNamePatterns = [
      /(?:company|business)(?:\s+name)?:?\s*([A-Z][A-Za-z\s&',.-]+?)(?:\n|\.|,|$)/i,
      /([A-Z][A-Za-z\s&',.-]+?)\s+(?:is a|will be|operates)/i,
      /\*\*([A-Z][A-Za-z\s&',.-]+?)\*\*/
    ];

    for (const pattern of businessNamePatterns) {
      const match = content.match(pattern);
      if (match && match[1] && match[1].length < 50) {
        businessName = match[1].trim();
        break;
      }
    }

    // Split content into potential sections
    const lines = content.split('\n');
    let currentSection: string | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check if this line is a section header
      const detectedSection = this.detectSectionHeader(trimmedLine);
      
      if (detectedSection) {
        // Save previous section if it exists
        if (currentSection && currentContent.length > 0) {
          const sectionContent = currentContent.join('\n').trim();
          if (sectionContent.length > 50) { // Only save substantial content
            sections[currentSection] = {
              id: currentSection,
              title: this.getSectionTitle(currentSection),
              content: sectionContent,
              completed: true,
              lastUpdated: new Date().toISOString(),
              aiGenerated: true
            };
          }
        }

        // Start new section
        currentSection = detectedSection;
        currentContent = [];
      } else if (currentSection) {
        // Add content to current section
        currentContent.push(line);
      }
    }

    // Save final section
    if (currentSection && currentContent.length > 0) {
      const sectionContent = currentContent.join('\n').trim();
      if (sectionContent.length > 50) {
        sections[currentSection] = {
          id: currentSection,
          title: this.getSectionTitle(currentSection),
          content: sectionContent,
          completed: true,
          lastUpdated: new Date().toISOString(),
          aiGenerated: true
        };
      }
    }

    // If no clear sections found but content looks like business plan, create executive summary
    if (Object.keys(sections).length === 0 && this.containsBusinessPlanContent(content)) {
      sections.executive_summary = {
        id: 'executive_summary',
        title: 'Executive Summary',
        content: content.substring(0, 2000), // First 2000 chars
        completed: true,
        lastUpdated: new Date().toISOString(),
        aiGenerated: true
      };
    }

    const completionPercentage = Math.round((Object.keys(sections).length / this.BUSINESS_PLAN_SECTIONS.length) * 100);

    // Generate title from business name or content
    if (!title) {
      title = businessName ? `${businessName} Business Plan` : 'AI-Generated Business Plan';
    }

    return {
      sections,
      title,
      businessName,
      completionPercentage
    };
  }

  /**
   * Detects section headers in content
   */
  private static detectSectionHeader(line: string): string | null {
    const lowerLine = line.toLowerCase();
    
    // Remove common formatting characters
    const cleanLine = lowerLine.replace(/[#*\-=:]/g, '').trim();

    for (const [sectionId, keywords] of Object.entries(this.SECTION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (cleanLine.includes(keyword)) {
          return sectionId;
        }
      }
    }

    return null;
  }

  /**
   * Gets human-readable section title
   */
  private static getSectionTitle(sectionId: string): string {
    const titles: Record<string, string> = {
      executive_summary: 'Executive Summary',
      business_description: 'Business Description',
      market_analysis: 'Market Analysis',
      products_services: 'Products & Services',
      marketing_plan: 'Marketing Plan',
      operations_plan: 'Operations Plan',
      financial_projections: 'Financial Projections',
      funding_request: 'Funding Request',
      owner_bio: 'Management Team'
    };

    return titles[sectionId] || sectionId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Merges new sections with existing business plan sections
   */
  static mergeSections(
    existingSections: Record<string, any>, 
    newSections: Record<string, BusinessPlanSection>
  ): Record<string, any> {
    const merged = { ...existingSections };

    for (const [sectionId, newSection] of Object.entries(newSections)) {
      const existing = merged[sectionId];
      
      if (!existing || existing.content?.length < newSection.content.length) {
        // Use new section if no existing or new is more comprehensive
        merged[sectionId] = newSection;
      } else if (existing && newSection.content.length > 100) {
        // Append new content if it's substantial
        merged[sectionId] = {
          ...existing,
          content: existing.content + '\n\n--- AI Addition ---\n' + newSection.content,
          lastUpdated: new Date().toISOString()
        };
      }
    }

    return merged;
  }
}