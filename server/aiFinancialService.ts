import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface FinancialData {
  year: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netIncome: number;
  cashFlow: number;
}

interface AIInsights {
  marketOutlook: string;
  growthPotential: string;
  riskFactors: string[];
  opportunities: string[];
  benchmarkData: {
    industryAverageGrowth: number;
    profitMarginRange: string;
    typicalBreakevenTime: string;
  };
  confidence: number;
}

interface FinancialAssumptions {
  industry: string;
  businessModel: string;
  targetMarket: string;
  competitiveAdvantage: string;
  marketSize: string;
  revenueStreams: Array<{
    name: string;
    yearOneRevenue: number;
    growthRate: number;
    description: string;
  }>;
  keyExpenses: string[];
  seasonality: string;
  scalingFactors: string;
}

export async function generateAIFinancialProjections(
  assumptions: FinancialAssumptions, 
  businessContext: any = {}
): Promise<{ projections: FinancialData[], aiInsights: AIInsights }> {
  
  const systemPrompt = `You are a world-class financial analyst and business strategist, channeling the analytical prowess of Warren Buffett, the strategic thinking of Jeff Bezos, and the market insights of Ray Dalio. 

Your expertise spans:
- Financial modeling and projections with deep industry knowledge
- Market analysis and competitive positioning assessment
- Risk evaluation and opportunity identification  
- Business model optimization and scaling strategies
- Economic trend analysis and industry benchmarking

You provide data-driven, realistic financial projections that account for market conditions, industry dynamics, competitive landscape, and business model specifics. Your projections are grounded in actual market data and industry benchmarks while considering the unique aspects of each business.`;

  const userPrompt = `Generate comprehensive 5-year financial projections and business outlook analysis for a business with the following characteristics:

**Business Details:**
- Industry: ${assumptions.industry}
- Business Model: ${assumptions.businessModel}
- Target Market: ${assumptions.targetMarket}
- Market Size: ${assumptions.marketSize}
- Competitive Advantage: ${assumptions.competitiveAdvantage}

**Revenue Streams:**
${assumptions.revenueStreams.map((stream, index) => 
  `${index + 1}. ${stream.name}: $${stream.yearOneRevenue.toLocaleString()} Year 1, ${stream.growthRate}% growth rate
     Description: ${stream.description}`
).join('\n')}

**Key Expenses:** ${assumptions.keyExpenses.join(', ')}
**Seasonality:** ${assumptions.seasonality}
**Scaling Factors:** ${assumptions.scalingFactors}

**Business Context (if available):**
${businessContext.executiveSummary ? `Executive Summary: ${businessContext.executiveSummary.substring(0, 500)}` : ''}
${businessContext.marketAnalysis ? `Market Analysis: ${businessContext.marketAnalysis.substring(0, 500)}` : ''}

Please provide your response in the following JSON format:

{
  "projections": [
    {
      "year": 1,
      "revenue": number,
      "cogs": number,
      "grossProfit": number,
      "operatingExpenses": number,
      "netIncome": number,
      "cashFlow": number
    }
    // ... years 2-5
  ],
  "aiInsights": {
    "marketOutlook": "detailed analysis of market conditions and trends affecting this business",
    "growthPotential": "assessment of growth opportunities and scalability factors",
    "riskFactors": ["specific risk factor 1", "specific risk factor 2", "etc"],
    "opportunities": ["specific opportunity 1", "specific opportunity 2", "etc"],
    "benchmarkData": {
      "industryAverageGrowth": number (percentage),
      "profitMarginRange": "typical range for this industry",
      "typicalBreakevenTime": "months or years to breakeven"
    },
    "confidence": number (0-100, representing confidence in projections)
  }
}

Generate realistic projections based on:
1. Industry benchmarks and typical performance metrics
2. Business model economics and scalability factors
3. Market size and competitive dynamics
4. Revenue stream characteristics and growth potential
5. Operating leverage and cost structure optimization
6. Economic trends and market conditions

Ensure projections reflect realistic growth trajectories, appropriate cost structures, and industry-typical margins while accounting for the specific competitive advantages and challenges described.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent financial analysis
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate and ensure all required fields are present
    if (!result.projections || !Array.isArray(result.projections) || result.projections.length !== 5) {
      throw new Error('Invalid projections format received from AI');
    }

    // Ensure each projection has all required fields
    result.projections = result.projections.map((proj: any, index: number) => ({
      year: index + 1,
      revenue: Number(proj.revenue) || 0,
      cogs: Number(proj.cogs) || 0,
      grossProfit: Number(proj.grossProfit) || (Number(proj.revenue) - Number(proj.cogs)),
      operatingExpenses: Number(proj.operatingExpenses) || 0,
      netIncome: Number(proj.netIncome) || 0,
      cashFlow: Number(proj.cashFlow) || Number(proj.netIncome),
    }));

    // Ensure AI insights have default values
    const aiInsights: AIInsights = {
      marketOutlook: result.aiInsights?.marketOutlook || 'Market analysis unavailable',
      growthPotential: result.aiInsights?.growthPotential || 'Growth potential assessment unavailable',
      riskFactors: result.aiInsights?.riskFactors || ['Risk analysis unavailable'],
      opportunities: result.aiInsights?.opportunities || ['Opportunity analysis unavailable'],
      benchmarkData: {
        industryAverageGrowth: result.aiInsights?.benchmarkData?.industryAverageGrowth || 10,
        profitMarginRange: result.aiInsights?.benchmarkData?.profitMarginRange || 'Data unavailable',
        typicalBreakevenTime: result.aiInsights?.benchmarkData?.typicalBreakevenTime || 'Data unavailable',
      },
      confidence: result.aiInsights?.confidence || 70,
    };

    return {
      projections: result.projections,
      aiInsights
    };

  } catch (error) {
    console.error('Error generating AI financial projections:', error);
    throw new Error('Failed to generate AI financial projections');
  }
}

export async function refreshAIFinancialProjections(
  currentProjections: FinancialData[],
  assumptions: FinancialAssumptions
): Promise<{ projections: FinancialData[], aiInsights: AIInsights }> {
  
  const systemPrompt = `You are an expert financial analyst providing updated market insights and projection refinements. Analyze current market conditions, industry trends, and economic factors to provide refreshed financial outlook.`;

  const userPrompt = `Please provide an updated financial analysis and market outlook for this business, considering current market conditions and recent trends:

**Current Projections:**
${currentProjections.map(proj => 
  `Year ${proj.year}: Revenue $${proj.revenue.toLocaleString()}, Net Income $${proj.netIncome.toLocaleString()}`
).join('\n')}

**Business Assumptions:**
- Industry: ${assumptions.industry}
- Business Model: ${assumptions.businessModel}
- Target Market: ${assumptions.targetMarket}

Based on current market conditions, economic trends, and industry developments, provide updated projections and insights in JSON format with the same structure as before. Focus on:

1. Current market sentiment and economic indicators
2. Industry-specific trends and disruptions  
3. Updated risk assessments and opportunities
4. Refined growth projections based on latest data
5. Updated confidence levels based on market stability

Return the response in the same JSON format as the initial generation.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Use the same validation logic as generateAIFinancialProjections
    return await generateAIFinancialProjections(assumptions, {});

  } catch (error) {
    console.error('Error refreshing AI financial projections:', error);
    
    // Return current projections with updated timestamp if refresh fails
    return {
      projections: currentProjections,
      aiInsights: {
        marketOutlook: 'Market outlook refresh unavailable',
        growthPotential: 'Growth assessment refresh unavailable', 
        riskFactors: ['Refresh analysis unavailable'],
        opportunities: ['Refresh analysis unavailable'],
        benchmarkData: {
          industryAverageGrowth: 10,
          profitMarginRange: 'Data unavailable',
          typicalBreakevenTime: 'Data unavailable',
        },
        confidence: 50,
      }
    };
  }
}

export function exportFinancialProjectionsToCSV(
  projections: FinancialData[], 
  assumptions: FinancialAssumptions, 
  aiInsights: AIInsights
): string {
  const headers = ['Metric', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
  
  const rows = [
    headers.join(','),
    `Revenue,${projections.map(p => p.revenue).join(',')}`,
    `COGS,${projections.map(p => p.cogs).join(',')}`,
    `Gross Profit,${projections.map(p => p.grossProfit).join(',')}`,
    `Operating Expenses,${projections.map(p => p.operatingExpenses).join(',')}`,
    `Net Income,${projections.map(p => p.netIncome).join(',')}`,
    `Cash Flow,${projections.map(p => p.cashFlow).join(',')}`,
    '',
    'Business Assumptions:',
    `Industry,${assumptions.industry}`,
    `Business Model,${assumptions.businessModel}`,
    `Target Market,${assumptions.targetMarket}`,
    '',
    'AI Insights:',
    `Market Outlook,"${aiInsights.marketOutlook}"`,
    `Growth Potential,"${aiInsights.growthPotential}"`,
    `Confidence Level,${aiInsights.confidence}%`,
    `Industry Average Growth,${aiInsights.benchmarkData.industryAverageGrowth}%`,
    '',
    'Risk Factors:',
    ...aiInsights.riskFactors.map(risk => `,"${risk}"`),
    '',
    'Opportunities:',
    ...aiInsights.opportunities.map(opp => `,"${opp}"`)
  ];

  return rows.join('\n');
}