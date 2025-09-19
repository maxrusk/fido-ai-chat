import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calculator, TrendingUp, DollarSign, BarChart3, Download, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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

export default function AIFinancialCalculator() {
  const [activeTab, setActiveTab] = useState('input');
  const [isGenerating, setIsGenerating] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    businessType: '',
    pricingModel: 'one-time',
    unitPrice: 0,
    subscriptionPrice: 0,
    expectedSalesVolume: 0,
    targetCustomersPerMonth: 0,
    startupCosts: 0,
    monthlyRent: 0,
    monthlySalaries: 0,
    monthlyMarketing: 0,
    monthlyTools: 0,
    cogsPerUnit: 0,
    cogsPercentage: 0,
    growthAssumption: 10,
    seasonalityFactors: Array(12).fill(1.0)
  });
  const [projections, setProjections] = useState<FinancialProjection[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const { toast } = useToast();

  const businessTypes = [
    'SaaS/Software',
    'E-commerce',
    'Food Service',
    'Consulting',
    'Manufacturing',
    'Retail Store',
    'Online Service',
    'Professional Services',
    'Healthcare',
    'Education/Training'
  ];

  const handleInputChange = (field: keyof BusinessProfile, value: any) => {
    setBusinessProfile(prev => ({ ...prev, [field]: value }));
  };

  const generateProjections = async () => {
    if (!businessProfile.businessType) {
      toast({
        title: "Missing Information",
        description: "Please select a business type to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/financial-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ businessProfile })
      });

      if (!response.ok) {
        throw new Error('Failed to generate projections');
      }

      const data = await response.json();
      setProjections(data.projections);
      setAnalysis(data.analysis);
      setActiveTab('results');
      
      toast({
        title: "Projections Generated",
        description: "AI has created realistic financial projections based on your business profile."
      });
    } catch (error) {
      console.error('Error generating projections:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate projections. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportProjections = (format: 'csv' | 'pdf') => {
    // Implementation for export functionality
    const exportData = {
      projections,
      analysis,
      businessProfile
    };
    
    // For now, download as JSON - could be enhanced with actual CSV/PDF export
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-projections.${format === 'csv' ? 'json' : 'json'}`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: `Financial projections exported as ${format.toUpperCase()}`
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AI Financial Projections Calculator
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate realistic financial forecasts using AI-powered analysis of your business profile
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Business Profile
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Projections
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select value={businessProfile.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="pricingModel">Pricing Model</Label>
                  <Select value={businessProfile.pricingModel} onValueChange={(value) => handleInputChange('pricingModel', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-time Purchase</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="usage-based">Usage-based</SelectItem>
                      <SelectItem value="hybrid">Hybrid Model</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {businessProfile.pricingModel === 'one-time' && (
                  <div>
                    <Label htmlFor="unitPrice">Unit Price ($)</Label>
                    <Input
                      type="number"
                      value={businessProfile.unitPrice}
                      onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                )}

                {businessProfile.pricingModel === 'subscription' && (
                  <div>
                    <Label htmlFor="subscriptionPrice">Monthly Subscription ($)</Label>
                    <Input
                      type="number"
                      value={businessProfile.subscriptionPrice}
                      onChange={(e) => handleInputChange('subscriptionPrice', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="targetCustomers">Target Customers/Month</Label>
                  <Input
                    type="number"
                    value={businessProfile.targetCustomersPerMonth}
                    onChange={(e) => handleInputChange('targetCustomersPerMonth', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="growthRate">Monthly Growth Rate (%)</Label>
                  <Input
                    type="number"
                    value={businessProfile.growthAssumption}
                    onChange={(e) => handleInputChange('growthAssumption', parseFloat(e.target.value) || 0)}
                    placeholder="10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Costs & Expenses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startupCosts">One-time Startup Costs ($)</Label>
                  <Input
                    type="number"
                    value={businessProfile.startupCosts}
                    onChange={(e) => handleInputChange('startupCosts', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="monthlyRent">Monthly Rent ($)</Label>
                  <Input
                    type="number"
                    value={businessProfile.monthlyRent}
                    onChange={(e) => handleInputChange('monthlyRent', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="monthlySalaries">Monthly Salaries ($)</Label>
                  <Input
                    type="number"
                    value={businessProfile.monthlySalaries}
                    onChange={(e) => handleInputChange('monthlySalaries', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="monthlyMarketing">Monthly Marketing ($)</Label>
                  <Input
                    type="number"
                    value={businessProfile.monthlyMarketing}
                    onChange={(e) => handleInputChange('monthlyMarketing', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="monthlyTools">Monthly Tools/Software ($)</Label>
                  <Input
                    type="number"
                    value={businessProfile.monthlyTools}
                    onChange={(e) => handleInputChange('monthlyTools', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="cogsPercentage">Cost of Goods Sold (%)</Label>
                  <Input
                    type="number"
                    value={businessProfile.cogsPercentage}
                    onChange={(e) => handleInputChange('cogsPercentage', parseFloat(e.target.value) || 0)}
                    placeholder="30"
                    max="100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button 
              onClick={generateProjections} 
              disabled={isGenerating}
              size="lg"
              className="px-8"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Projections...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate AI Projections
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {projections.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">12-Month Financial Projections</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => exportProjections('csv')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={() => exportProjections('pdf')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue & Cash Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={projections}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="monthName" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
                        <Line type="monotone" dataKey="cumulativeCashFlow" stroke="#10b981" strokeWidth={2} name="Cash Flow" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Profit Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={projections}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="monthName" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                        <Bar dataKey="grossProfit" fill="#3b82f6" name="Gross Profit" />
                        <Bar dataKey="netIncome" fill="#10b981" name="Net Income" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Detailed Monthly Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Month</th>
                          <th className="text-right p-2">Revenue</th>
                          <th className="text-right p-2">COGS</th>
                          <th className="text-right p-2">Gross Profit</th>
                          <th className="text-right p-2">OpEx</th>
                          <th className="text-right p-2">Net Income</th>
                          <th className="text-right p-2">Cumulative Cash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projections.map((projection) => (
                          <tr key={projection.month} className="border-b">
                            <td className="p-2">{projection.monthName}</td>
                            <td className="text-right p-2">${projection.revenue.toLocaleString()}</td>
                            <td className="text-right p-2">${projection.cogs.toLocaleString()}</td>
                            <td className="text-right p-2">${projection.grossProfit.toLocaleString()}</td>
                            <td className="text-right p-2">${projection.operatingExpenses.toLocaleString()}</td>
                            <td className="text-right p-2 font-medium">${projection.netIncome.toLocaleString()}</td>
                            <td className="text-right p-2 font-bold">${projection.cumulativeCashFlow.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {analysis && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Break-Even Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-6">
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                      Month {analysis.breakEvenMonth}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Projected break-even point based on your business model
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.keyInsights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Risk Factors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.riskFactors.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>AI Assumptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.assumptions.map((assumption, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {assumption}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}