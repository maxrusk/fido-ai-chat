import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Users, 
  Building,
  CreditCard,
  Briefcase,
  PieChart,
  FileText,
  Calculator,
  Upload
} from 'lucide-react';

interface FundingToolkitProps {
  onTemplateSelect: (template: string) => void;
  className?: string;
  trigger?: React.ReactNode;
}

const fundingOptions = [
  {
    id: "sba-loan-analysis",
    icon: <Building className="h-4 w-4" />,
    title: "SBA Loan Strategy",
    description: "Comprehensive SBA loan application guidance",
    prompt: "Help me develop a complete SBA loan strategy. Analyze my business profile, determine the best SBA loan programs (7(a), 504, microloans), prepare required documentation, and create a compelling loan application that maximizes approval chances."
  },
  {
    id: "venture-capital",
    icon: <TrendingUp className="h-4 w-4" />,
    title: "Venture Capital Roadmap",
    description: "VC funding strategy and pitch preparation",
    prompt: "Guide me through the venture capital funding process. Help me understand different VC stages (pre-seed, seed, Series A-C), identify suitable investors, prepare a compelling pitch deck, and develop a fundraising timeline and strategy."
  },
  {
    id: "angel-investors",
    icon: <Users className="h-4 w-4" />,
    title: "Angel Investor Network",
    description: "Connect with angel investors effectively",
    prompt: "Help me build a strategy to connect with angel investors. Identify potential angel networks, craft compelling investor outreach, prepare for angel meetings, and structure angel investment terms that work for both parties."
  },
  {
    id: "grants-research",
    icon: <FileText className="h-4 w-4" />,
    title: "Grant Opportunities",
    description: "Government and private grant research",
    prompt: "Research and identify grant opportunities for my business. Help me understand federal, state, and private grants, assess eligibility requirements, and develop winning grant applications with compelling narratives."
  },
  {
    id: "revenue-based-financing",
    icon: <BarChart3 className="h-4 w-4" />,
    title: "Revenue-Based Financing",
    description: "Alternative funding through revenue sharing",
    prompt: "Explore revenue-based financing options for my business. Help me understand how RBF works, identify suitable RBF providers, evaluate terms and costs, and determine if this funding model aligns with my business goals."
  },
  {
    id: "crowdfunding-strategy",
    icon: <Target className="h-4 w-4" />,
    title: "Crowdfunding Campaign",
    description: "Kickstarter, Indiegogo, and equity crowdfunding",
    prompt: "Design a comprehensive crowdfunding strategy. Help me choose the right platform (Kickstarter, Indiegogo, equity crowdfunding), create compelling campaign content, set realistic funding goals, and plan pre-launch and marketing strategies."
  }
];

const capitalStackOptions = [
  {
    id: "capital-stack-analysis",
    title: "Capital Stack Optimization",
    description: "Blend multiple funding sources strategically",
    prompt: "Help me design an optimal capital stack for my business. Analyze my funding needs, recommend the right mix of debt, equity, and alternative financing, and create a phased funding strategy that minimizes dilution while meeting growth objectives."
  },
  {
    id: "financial-projections",
    title: "Investor-Ready Financials",
    description: "Build compelling financial models",
    prompt: "Create comprehensive financial projections that investors and lenders expect. Help me build realistic revenue forecasts, cash flow models, break-even analysis, and scenario planning that demonstrates strong business fundamentals."
  },
  {
    id: "valuation-analysis",
    title: "Business Valuation",
    description: "Determine your company's worth",
    prompt: "Help me understand and calculate my business valuation using multiple methodologies (DCF, comparable companies, precedent transactions). Prepare for investor discussions with defensible valuation arguments and equity structuring options."
  }
];

const riskAssessmentOptions = [
  {
    id: "credit-improvement",
    title: "Credit Score Optimization",
    description: "Improve business and personal credit",
    prompt: "Analyze my credit profile and create a comprehensive credit improvement strategy. Help me understand credit factors that impact loan approval, develop a timeline for credit enhancement, and implement strategies to maximize creditworthiness."
  },
  {
    id: "collateral-strategy",
    title: "Collateral & Security Planning",
    description: "Asset-based lending strategies",
    prompt: "Evaluate my assets for collateral-based financing. Help me understand asset-based lending, inventory financing, equipment loans, and real estate-backed funding options while managing risk and maintaining operational flexibility."
  },
  {
    id: "risk-mitigation",
    title: "Funding Risk Analysis",
    description: "Identify and mitigate funding risks",
    prompt: "Conduct a comprehensive funding risk analysis. Help me identify potential obstacles to securing capital, develop contingency funding plans, and create risk mitigation strategies that strengthen my overall funding position."
  }
];

export default function FundingToolkit({ onTemplateSelect, className, trigger }: FundingToolkitProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        onTemplateSelect(`I've uploaded a financial document: ${file.name}. Please review this and help me optimize my funding strategy based on its contents.`);
        setShowUploadDialog(false);
      }
    };
    input.click();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger || (
            <Button
              variant="outline"
              size="sm"
              className={`h-10 px-3 sm:px-4 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all justify-start min-w-0 ${className}`}
            >
              <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm truncate">Funding Toolkit</span>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80 md:w-96 max-h-[70vh] overflow-y-auto">
          <DropdownMenuLabel className="text-sm font-semibold">
            💰 Capital Architect Toolkit
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
            Funding Sources
          </DropdownMenuLabel>
          {fundingOptions.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => onTemplateSelect(option.prompt)}
              className="flex items-start p-3 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <div className="mr-3 mt-0.5 text-green-600">{option.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{option.title}</div>
                <div className="text-xs text-gray-500 mt-1">{option.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
            Capital Strategy
          </DropdownMenuLabel>
          {capitalStackOptions.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => onTemplateSelect(option.prompt)}
              className="flex-col items-start p-3 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <div className="font-medium text-sm">{option.title}</div>
              <div className="text-xs text-gray-500 mt-1">{option.description}</div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
            Risk & Credit
          </DropdownMenuLabel>
          {riskAssessmentOptions.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => onTemplateSelect(option.prompt)}
              className="flex-col items-start p-3 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <div className="font-medium text-sm">{option.title}</div>
              <div className="text-xs text-gray-500 mt-1">{option.description}</div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
            Document Tools
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={handleFileUpload}
            className="flex items-center p-3 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <Upload className="h-4 w-4 mr-3 text-green-600" />
            <div>
              <div className="font-medium text-sm">Upload Financial Document</div>
              <div className="text-xs text-gray-500">Upload financials, loan docs, or investor materials</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}