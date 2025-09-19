import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface BusinessProfile {
  businessType: string;
  pricingModel: string;
  unitPrice: number;
  subscriptionPrice: number;
  expectedSalesVolume: number;
  targetCustomersPerMonth: number;
  startupCosts: number;
  monthlyRent: number;
  monthlySalaries: number;
  monthlyMarketing: number;
  monthlyTools: number;
  cogsPerUnit: number;
  cogsPercentage: number;
  growthAssumption: number;
  seasonalityFactors: number[];
}

interface FinancialProjection {
  month: number;
  monthName: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netIncome: number;
  cumulativeCashFlow: number;
}

interface AIAnalysis {
  assumptions: string[];
  breakEvenMonth: number;
  keyInsights: string[];
  riskFactors: string[];
  recommendations: string[];
}

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export async function generateFinancialProjections(businessProfile: BusinessProfile) {
  // Create AI prompt for contextual analysis
  const aiPrompt = `
You are a financial expert analyzing a business for 12-month financial projections. Based on the business profile below, provide realistic financial forecasting with clear assumptions.

Business Profile:
- Type: ${businessProfile.businessType}
- Pricing Model: ${businessProfile.pricingModel}
- ${businessProfile.pricingModel === 'subscription' ? `Monthly Price: $${businessProfile.subscriptionPrice}` : `Unit Price: $${businessProfile.unitPrice}`}
- Target Customers/Month: ${businessProfile.targetCustomersPerMonth}
- Monthly Growth Rate: ${businessProfile.growthAssumption}%
- Startup Costs: $${businessProfile.startupCosts}
- Monthly Fixed Costs: Rent $${businessProfile.monthlyRent}, Salaries $${businessProfile.monthlySalaries}, Marketing $${businessProfile.monthlyMarketing}, Tools $${businessProfile.monthlyTools}
- COGS: ${businessProfile.cogsPercentage}%

Provide a JSON response with the following structure:
{
  "monthlyGrowthFactors": [12 numbers representing realistic monthly growth/seasonality],
  "assumptions": ["list of key assumptions made in calculations"],
  "keyInsights": ["3-4 key business insights"],
  "riskFactors": ["3-4 main risk factors"],
  "recommendations": ["3-4 actionable recommendations"],
  "industryBenchmarks": {
    "typicalGrowthRate": "percentage",
    "averageBreakEvenMonths": "number",
    "profitMarginRange": "range"
  }
}

Consider industry-specific factors, seasonality, customer acquisition challenges, and realistic growth patterns for ${businessProfile.businessType} businesses.
`;

  try {
    // Get AI analysis
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a financial expert who provides realistic business projections. Always respond with valid JSON only, no additional text."
        },
        {
          role: "user",
          content: aiPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const aiAnalysis = JSON.parse(aiResponse.choices[0].message.content || '{}');
    
    // Calculate monthly projections using AI insights
    const projections: FinancialProjection[] = [];
    let cumulativeCashFlow = -businessProfile.startupCosts; // Start with negative startup costs
    let breakEvenMonth = 12; // Default if break-even not reached
    
    const baseRevenue = businessProfile.pricingModel === 'subscription' 
      ? businessProfile.subscriptionPrice * businessProfile.targetCustomersPerMonth
      : businessProfile.unitPrice * businessProfile.targetCustomersPerMonth;
    
    const monthlyFixedCosts = businessProfile.monthlyRent + 
                             businessProfile.monthlySalaries + 
                             businessProfile.monthlyMarketing + 
                             businessProfile.monthlyTools;

    for (let month = 1; month <= 12; month++) {
      // Apply growth and seasonality factors
      const growthFactor = Math.pow(1 + businessProfile.growthAssumption / 100, month - 1);
      const seasonalityFactor = aiAnalysis.monthlyGrowthFactors 
        ? aiAnalysis.monthlyGrowthFactors[month - 1] || 1
        : 1;
      
      const monthlyRevenue = Math.round(baseRevenue * growthFactor * seasonalityFactor);
      const monthlyCogs = Math.round(monthlyRevenue * (businessProfile.cogsPercentage / 100));
      const grossProfit = monthlyRevenue - monthlyCogs;
      const operatingExpenses = monthlyFixedCosts;
      const netIncome = grossProfit - operatingExpenses;
      
      cumulativeCashFlow += netIncome;
      
      // Track break-even point
      if (cumulativeCashFlow > 0 && breakEvenMonth === 12) {
        breakEvenMonth = month;
      }
      
      projections.push({
        month,
        monthName: monthNames[month - 1],
        revenue: monthlyRevenue,
        cogs: monthlyCogs,
        grossProfit,
        operatingExpenses,
        netIncome,
        cumulativeCashFlow
      });
    }

    const analysis: AIAnalysis = {
      assumptions: aiAnalysis.assumptions || [
        `${businessProfile.growthAssumption}% monthly growth rate applied consistently`,
        `${businessProfile.cogsPercentage}% cost of goods sold based on industry standards`,
        `Fixed operating expenses of $${monthlyFixedCosts.toLocaleString()} per month`,
        `Customer acquisition aligned with ${businessProfile.businessType} industry patterns`
      ],
      breakEvenMonth,
      keyInsights: aiAnalysis.keyInsights || [
        `Total first-year revenue projected at $${projections.reduce((sum, p) => sum + p.revenue, 0).toLocaleString()}`,
        `Average monthly growth rate of ${businessProfile.growthAssumption}% creates exponential scaling`,
        `Break-even achieved in month ${breakEvenMonth} with positive cash flow thereafter`,
        `${businessProfile.businessType} model shows ${projections[11].netIncome > 0 ? 'strong' : 'challenging'} profitability potential`
      ],
      riskFactors: aiAnalysis.riskFactors || [
        'Customer acquisition costs may exceed projections in competitive markets',
        'Economic downturns could impact target customer spending patterns',
        'Scaling operational expenses may grow faster than revenue',
        'Industry-specific regulations could increase compliance costs'
      ],
      recommendations: aiAnalysis.recommendations || [
        'Focus on customer retention to reduce acquisition costs over time',
        'Monitor key metrics monthly and adjust pricing strategy as needed',
        'Build cash reserves during profitable months for growth investments',
        'Consider diversifying revenue streams to reduce market risk'
      ]
    };

    return {
      projections,
      analysis,
      businessProfile
    };
    
  } catch (error) {
    console.error('Error in AI financial calculation:', error);
    
    // Fallback to basic calculations if AI fails
    const projections: FinancialProjection[] = [];
    let cumulativeCashFlow = -businessProfile.startupCosts;
    let breakEvenMonth = 12;
    
    const baseRevenue = businessProfile.pricingModel === 'subscription' 
      ? businessProfile.subscriptionPrice * businessProfile.targetCustomersPerMonth
      : businessProfile.unitPrice * businessProfile.targetCustomersPerMonth;
    
    const monthlyFixedCosts = businessProfile.monthlyRent + 
                             businessProfile.monthlySalaries + 
                             businessProfile.monthlyMarketing + 
                             businessProfile.monthlyTools;

    for (let month = 1; month <= 12; month++) {
      const growthFactor = Math.pow(1 + businessProfile.growthAssumption / 100, month - 1);
      const monthlyRevenue = Math.round(baseRevenue * growthFactor);
      const monthlyCogs = Math.round(monthlyRevenue * (businessProfile.cogsPercentage / 100));
      const grossProfit = monthlyRevenue - monthlyCogs;
      const operatingExpenses = monthlyFixedCosts;
      const netIncome = grossProfit - operatingExpenses;
      
      cumulativeCashFlow += netIncome;
      
      if (cumulativeCashFlow > 0 && breakEvenMonth === 12) {
        breakEvenMonth = month;
      }
      
      projections.push({
        month,
        monthName: monthNames[month - 1],
        revenue: monthlyRevenue,
        cogs: monthlyCogs,
        grossProfit,
        operatingExpenses,
        netIncome,
        cumulativeCashFlow
      });
    }

    const analysis: AIAnalysis = {
      assumptions: [
        `${businessProfile.growthAssumption}% monthly growth rate applied`,
        `${businessProfile.cogsPercentage}% cost of goods sold`,
        `Fixed operating expenses of $${monthlyFixedCosts.toLocaleString()} per month`,
        'Linear growth pattern without seasonality adjustments'
      ],
      breakEvenMonth,
      keyInsights: [
        `Total first-year revenue projected at $${projections.reduce((sum, p) => sum + p.revenue, 0).toLocaleString()}`,
        `Break-even achieved in month ${breakEvenMonth}`,
        `${businessProfile.businessType} model analysis completed with basic assumptions`
      ],
      riskFactors: [
        'Projections based on simplified model due to AI processing error',
        'Market conditions and competition not fully analyzed',
        'Recommend professional financial review for investment decisions'
      ],
      recommendations: [
        'Monitor actual performance against projections monthly',
        'Adjust assumptions based on real market feedback',
        'Consider professional financial planning consultation'
      ]
    };

    return {
      projections,
      analysis,
      businessProfile
    };
  }
}