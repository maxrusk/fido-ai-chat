import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Lightbulb,
  BarChart3,
  Settings,
  Download,
  Upload,
  Zap
} from "lucide-react";

interface BusinessPlanToolkitProps {
  onTemplateSelect: (template: string) => void;
  className?: string;
  trigger?: React.ReactNode;
}

const businessPlanSections = [
  {
    id: "executive-summary",
    icon: <Zap className="h-4 w-4" />,
    title: "Executive Summary (Start Here)",
    description: "REQUIRED FIRST SECTION - Foundation of your business plan",
    prompt: "I need to start with my Executive Summary - the foundation section that must be completed first. This is the most critical section where I'll outline my business concept, mission, target market, and key objectives. Please help me create a comprehensive Executive Summary that follows best practices."
  },
  {
    id: "market-analysis",
    icon: <BarChart3 className="h-4 w-4" />,
    title: "Market Analysis",
    description: "Research your target market - Complete after Executive Summary",
    prompt: "I want to work on my Market Analysis section. Before we continue, please confirm that my Executive Summary is complete and then help me conduct comprehensive market research including target market, competition, and market size analysis."
  },
  {
    id: "business-model",
    icon: <Target className="h-4 w-4" />,
    title: "Business Description",
    description: "Define your business model and structure - Section 2",
    prompt: "I want to work on my Business Description section. Please confirm my Executive Summary is complete, then help me define my business model, legal structure, and explain the specific problem my business solves."
  },
  {
    id: "products-services",
    icon: <Target className="h-4 w-4" />,
    title: "Products & Services",
    description: "Detail your offerings and value proposition - Section 4", 
    prompt: "I want to work on my Products & Services section. Please confirm that I've completed Executive Summary, Business Description, and Market Analysis first, then help me detail my offerings and value proposition."
  },
  {
    id: "marketing-strategy",
    icon: <TrendingUp className="h-4 w-4" />,
    title: "Marketing Plan",
    description: "Customer acquisition strategy - Section 5",
    prompt: "I want to work on my Marketing Plan section. Please confirm that I've completed Executive Summary, Business Description, Market Analysis, and Products & Services sections first, then help me develop a comprehensive marketing strategy and customer acquisition plan."
  },
  {
    id: "operations-plan",
    icon: <Settings className="h-4 w-4" />,
    title: "Operations Plan",
    description: "Business operations structure - Section 6",
    prompt: "I want to work on my Operations Plan section. Please confirm that I've completed all previous sections (Executive Summary through Marketing Plan) first, then help me design efficient business operations, staffing, and logistics."
  },
  {
    id: "financial-projections",
    icon: <DollarSign className="h-4 w-4" />,
    title: "Financial Projections",
    description: "Revenue forecasts and budgets - Section 7",
    prompt: "I want to work on my Financial Projections section. Please confirm that I've completed Executive Summary through Operations Plan first, then help me create comprehensive financial forecasts, revenue projections, and expense budgets."
  },
  {
    id: "funding-request",
    icon: <Lightbulb className="h-4 w-4" />,
    title: "Funding Request",
    description: "Capital requirements and strategy - Section 8",
    prompt: "I want to work on my Funding Request section. Please confirm that I've completed all previous sections through Financial Projections first, then help me detail my capital needs, use of funds, and repayment strategy."
  },
  {
    id: "team-structure",
    icon: <Users className="h-4 w-4" />,
    title: "Owner Bio & Team",
    description: "Management team and leadership - Section 9",
    prompt: "I want to work on my Owner Bio and Management Team section. Please confirm that I've completed all other business plan sections first, then help me showcase my background, experience, and team qualifications."
  }
];

const quickStartOptions = [
  {
    id: "startup-canvas",
    title: "Startup Canvas",
    description: "Quick business model overview",
    prompt: "Let's create a lean startup canvas for my business idea using Eric Ries' lean methodology and Steve Blank's customer development approach."
  },
  {
    id: "pitch-deck",
    title: "Investor Pitch Deck",
    description: "Presentation for investors",
    prompt: "Help me create a compelling investor pitch deck using Guy Kawasaki's 10/20/30 rule and drawing inspiration from successful pitches like Airbnb and Uber's early presentations."
  },
  {
    id: "sba-loan-plan",
    title: "SBA Loan Business Plan",
    description: "SBA-compliant business plan",
    prompt: "Guide me in creating an SBA loan-compliant business plan that meets all requirements while showcasing my business vision effectively."
  }
];

export default function BusinessPlanToolkit({ onTemplateSelect, className, trigger }: BusinessPlanToolkitProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.pdf,.doc,.docx,.png,.jpg,.jpeg';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        onTemplateSelect(`I've uploaded a file: ${file.name}. Please review this document and help me improve my business plan based on its contents.`);
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
              <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm truncate">Business Plan Toolkit</span>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80 md:w-96 max-h-[70vh] overflow-y-auto">
          <DropdownMenuLabel className="text-sm font-semibold">
            🧠 Business Plan Toolkit
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
            Quick Start Options
          </DropdownMenuLabel>
          {quickStartOptions.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => onTemplateSelect(option.prompt)}
              className="flex-col items-start p-3 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            >
              <div className="font-medium text-sm">{option.title}</div>
              <div className="text-xs text-gray-500 mt-1">{option.description}</div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
            Business Plan Sections
          </DropdownMenuLabel>
          {businessPlanSections.map((section) => (
            <DropdownMenuItem
              key={section.id}
              onClick={() => {
                if (section.id === 'financial-projections') {
                  window.open('/financial-calculator', '_blank');
                } else {
                  onTemplateSelect(section.prompt);
                }
              }}
              className="flex items-start p-3 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            >
              <div className="mr-3 mt-0.5 text-indigo-600">{section.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{section.title}</div>
                <div className="text-xs text-gray-500 mt-1">{section.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
            Document Tools
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={handleFileUpload}
            className="flex items-center p-3 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            <Upload className="h-4 w-4 mr-3 text-indigo-600" />
            <div>
              <div className="font-medium text-sm">Upload Document</div>
              <div className="text-xs text-gray-500">Upload existing business plan for review</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTemplateSelect("Generate a comprehensive business plan export for me, including all sections we've discussed, formatted for download and presentation.")}
            className="flex items-center p-3 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            <Download className="h-4 w-4 mr-3 text-indigo-600" />
            <div>
              <div className="font-medium text-sm">Export Plan</div>
              <div className="text-xs text-gray-500">Generate downloadable business plan</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Business Document</DialogTitle>
            <DialogDescription>
              Upload your existing business plan, financial documents, or related files for analysis and improvement suggestions.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}