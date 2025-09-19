import OpenAI from "openai";
import { ProcessedDocument, DocumentProcessor } from "./documentProcessor";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface FinancialAnalysisResult {
  overallScore: number;
  keyFindings: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    risks: string[];
  };
  sectionAnalysis: {
    section: string;
    score: number;
    feedback: string;
    recommendations: string[];
    priority: 'high' | 'medium' | 'low';
  }[];
  financialMetrics: {
    metric: string;
    currentValue: string;
    benchmarkValue: string;
    status: 'good' | 'warning' | 'poor';
    recommendation: string;
  }[];
  actionItems: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
    estimatedImpact: string;
  }[];
}

export class FinancialAnalysisService {
  private documentProcessor: DocumentProcessor;

  constructor() {
    this.documentProcessor = new DocumentProcessor();
  }

  async analyzeFinancialPlan(filePath: string, fileType: string, fileName: string): Promise<FinancialAnalysisResult> {
    try {
      // Step 1: Process the document
      const processedDoc = await this.documentProcessor.processDocument(filePath, fileType);
      
      // Step 2: Extract financial metrics
      const financialMetrics = this.documentProcessor.extractFinancialMetrics(processedDoc.text);
      
      // Step 3: Generate AI analysis
      const analysisResult = await this.generateAIAnalysis(processedDoc, fileName);
      
      return analysisResult;
    } catch (error: any) {
      console.error('Error in financial analysis:', error);
      throw new Error(`Analysis failed: ${error?.message || 'Unknown error'}`);
    }
  }

  private async generateAIAnalysis(document: ProcessedDocument, fileName: string): Promise<FinancialAnalysisResult> {
    const prompt = `
    You are Capital Architect, an elite financial advisor AI. Analyze this business/financial plan document and provide comprehensive feedback.

    Document: ${fileName}
    Content: ${document.text.substring(0, 8000)} ${document.text.length > 8000 ? '...' : ''}
    
    Provide your analysis in the following JSON format:
    {
      "overallScore": <number 0-100>,
      "keyFindings": {
        "strengths": [<array of 3-5 key strengths>],
        "weaknesses": [<array of 3-5 areas needing improvement>],
        "opportunities": [<array of 3-5 growth opportunities>],
        "risks": [<array of 3-5 potential risks>]
      },
      "sectionAnalysis": [
        {
          "section": "<section name>",
          "score": <number 0-100>,
          "feedback": "<detailed feedback>",
          "recommendations": [<array of specific recommendations>],
          "priority": "<high|medium|low>"
        }
      ],
      "financialMetrics": [
        {
          "metric": "<metric name>",
          "currentValue": "<current value from document>",
          "benchmarkValue": "<industry benchmark>",
          "status": "<good|warning|poor>",
          "recommendation": "<specific recommendation>"
        }
      ],
      "actionItems": [
        {
          "title": "<action item title>",
          "description": "<detailed description>",
          "priority": "<high|medium|low>",
          "category": "<category like 'Financial Planning', 'Market Research', etc>",
          "estimatedImpact": "<expected impact description>"
        }
      ]
    }

    Analysis Guidelines:
    1. Focus on financial viability, market opportunity, and execution feasibility
    2. Provide specific, actionable recommendations
    3. Compare against industry standards where possible
    4. Identify gaps in financial planning, market analysis, and business model
    5. Suggest improvements for funding readiness
    6. Consider scalability and risk management
    7. Be constructive but honest about weaknesses
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are Capital Architect, channeling the collective wisdom of legendary business minds like Warren Buffett, Peter Drucker, and Clayton Christensen. Provide thorough, strategic analysis with actionable insights.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000
    });

    try {
      const analysisResult = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and sanitize the result
      return this.validateAndSanitizeAnalysis(analysisResult);
      
    } catch (error) {
      console.error('Error parsing AI analysis response:', error);
      throw new Error('Failed to parse AI analysis');
    }
  }

  private validateAndSanitizeAnalysis(analysis: any): FinancialAnalysisResult {
    // Provide defaults and validation for the analysis structure
    const defaultAnalysis: FinancialAnalysisResult = {
      overallScore: analysis.overallScore || 50,
      keyFindings: {
        strengths: analysis.keyFindings?.strengths || ['Document uploaded successfully'],
        weaknesses: analysis.keyFindings?.weaknesses || ['Analysis needs more detailed review'],
        opportunities: analysis.keyFindings?.opportunities || ['Consider market expansion'],
        risks: analysis.keyFindings?.risks || ['Market competition risks']
      },
      sectionAnalysis: analysis.sectionAnalysis || [
        {
          section: 'Overall Plan',
          score: analysis.overallScore || 50,
          feedback: 'General analysis of the uploaded document.',
          recommendations: ['Review and expand key sections'],
          priority: 'medium' as const
        }
      ],
      financialMetrics: analysis.financialMetrics || [
        {
          metric: 'Revenue Projections',
          currentValue: 'Not specified',
          benchmarkValue: 'Industry average',
          status: 'warning' as const,
          recommendation: 'Provide detailed revenue projections'
        }
      ],
      actionItems: analysis.actionItems || [
        {
          title: 'Enhance Financial Projections',
          description: 'Develop comprehensive financial forecasts',
          priority: 'high' as const,
          category: 'Financial Planning',
          estimatedImpact: 'Improved funding readiness'
        }
      ]
    };

    // Ensure score is within valid range
    if (defaultAnalysis.overallScore < 0) defaultAnalysis.overallScore = 0;
    if (defaultAnalysis.overallScore > 100) defaultAnalysis.overallScore = 100;

    return defaultAnalysis;
  }
}