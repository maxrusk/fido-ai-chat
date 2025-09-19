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
  TrendingUp, 
  Users, 
  Cog, 
  BarChart3, 
  Target, 
  Zap,
  Globe,
  Truck,
  Shield,
  Database,
  Workflow,
  LineChart,
  Settings,
  Upload
} from 'lucide-react';

interface GrowthToolkitProps {
  onTemplateSelect: (template: string) => void;
  className?: string;
  trigger?: React.ReactNode;
}

const scalingStrategies = [
  {
    id: "market-expansion",
    icon: <Globe className="h-4 w-4" />,
    title: "Market Expansion Strategy",
    description: "Geographic and demographic growth plans",
    prompt: "Help me develop a comprehensive market expansion strategy using Amazon's geographic expansion playbook and Starbucks' market penetration methodology. Analyze new market opportunities, assess market entry strategies, and create a phased expansion plan that minimizes risk while maximizing growth potential."
  },
  {
    id: "product-scaling",
    icon: <Zap className="h-4 w-4" />,
    title: "Product Line Scaling",
    description: "Expand offerings and product development",
    prompt: "Guide me through product line expansion using Apple's ecosystem approach and Netflix's content diversification strategy. Help me identify new product opportunities, prioritize development roadmaps, and create systems for continuous innovation and product scaling."
  },
  {
    id: "revenue-optimization",
    icon: <LineChart className="h-4 w-4" />,
    title: "Revenue Model Optimization",
    description: "Maximize revenue per customer and streams",
    prompt: "Optimize my revenue model using subscription strategies from Netflix, marketplace fees from Amazon, and upselling techniques from Salesforce. Help me identify new revenue streams, improve customer lifetime value, and implement pricing strategies that scale with growth."
  },
  {
    id: "digital-transformation",
    icon: <Database className="h-4 w-4" />,
    title: "Digital Transformation",
    description: "Technology and automation for scale",
    prompt: "Design a digital transformation strategy inspired by GE's digital factory and Toyota's lean automation. Help me identify automation opportunities, select scalable technology solutions, and implement digital systems that support rapid growth while maintaining quality."
  }
];

const operationsOptimization = [
  {
    id: "supply-chain",
    icon: <Truck className="h-4 w-4" />,
    title: "Supply Chain Excellence",
    description: "Optimize logistics and procurement",
    prompt: "Build a world-class supply chain using Amazon's logistics mastery and Walmart's supply chain efficiency. Help me optimize supplier relationships, implement just-in-time inventory, design distribution networks, and create supply chain resilience for scaling operations."
  },
  {
    id: "quality-systems",
    icon: <Shield className="h-4 w-4" />,
    title: "Quality Management Systems",
    description: "Maintain quality while scaling rapidly",
    prompt: "Implement quality management systems using Toyota's lean manufacturing principles and Six Sigma methodologies. Help me design quality control processes, create standard operating procedures, and establish quality metrics that ensure excellence at scale."
  },
  {
    id: "process-optimization",
    icon: <Workflow className="h-4 w-4" />,
    title: "Process Automation",
    description: "Streamline operations for efficiency",
    prompt: "Optimize business processes using McDonald's operational systems and FedEx's process excellence. Help me map current workflows, identify automation opportunities, implement process improvements, and create scalable operational frameworks."
  },
  {
    id: "performance-metrics",
    icon: <BarChart3 className="h-4 w-4" />,
    title: "Performance Dashboard",
    description: "KPIs and metrics for growth tracking",
    prompt: "Design a comprehensive performance measurement system using Google's OKR methodology and Amazon's customer-centric metrics. Help me identify key performance indicators, create dashboards for real-time monitoring, and establish data-driven decision-making processes."
  }
];

const teamGrowthStrategies = [
  {
    id: "organizational-design",
    icon: <Users className="h-4 w-4" />,
    title: "Organizational Structure",
    description: "Scale team structure and hierarchy",
    prompt: "Design an organizational structure for rapid scaling using Netflix's culture of freedom and responsibility and Google's innovative team structures. Help me plan departmental growth, define roles and responsibilities, and create organizational charts that support efficient scaling."
  },
  {
    id: "talent-acquisition",
    icon: <Target className="h-4 w-4" />,
    title: "Strategic Hiring Plan",
    description: "Recruit and retain top talent",
    prompt: "Develop a strategic hiring plan using Google's rigorous hiring process and Zappos' culture-first approach. Help me identify key roles for growth, create compelling job descriptions, design interview processes, and implement retention strategies for scaling teams."
  },
  {
    id: "culture-scaling",
    icon: <Zap className="h-4 w-4" />,
    title: "Culture & Values Scaling",
    description: "Maintain company culture during growth",
    prompt: "Scale company culture using Patagonia's values-driven approach and HubSpot's culture code methodology. Help me define core values, create culture onboarding processes, implement culture reinforcement systems, and maintain cultural integrity during rapid growth."
  },
  {
    id: "leadership-development",
    icon: <TrendingUp className="h-4 w-4" />,
    title: "Leadership Development",
    description: "Build management capabilities",
    prompt: "Develop leadership capabilities using GE's leadership development programs and McKinsey's leadership principles. Help me identify future leaders, create leadership training programs, implement mentorship systems, and build management bench strength for scaling operations."
  }
];

const technologyInfrastructure = [
  {
    id: "tech-stack-scaling",
    title: "Technology Stack Planning",
    description: "Scalable systems and architecture",
    prompt: "Design a scalable technology infrastructure using Netflix's cloud-native architecture and Uber's microservices approach. Help me assess current tech stack limitations, plan infrastructure upgrades, select scalable technologies, and create technology roadmaps that support 10x growth."
  },
  {
    id: "data-analytics",
    title: "Data & Analytics Platform",
    description: "Business intelligence and insights",
    prompt: "Build a comprehensive data analytics platform using Airbnb's data-driven culture and Facebook's analytics infrastructure. Help me implement data collection systems, create business intelligence dashboards, establish data governance, and use analytics for strategic decision-making."
  },
  {
    id: "cybersecurity-scaling",
    title: "Security & Compliance",
    description: "Protect growing digital assets",
    prompt: "Implement enterprise-grade security using Microsoft's security framework and financial services compliance standards. Help me assess security risks, implement cybersecurity measures, ensure regulatory compliance, and create security protocols that scale with business growth."
  }
];

export default function GrowthToolkit({ onTemplateSelect, className, trigger }: GrowthToolkitProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        onTemplateSelect(`I've uploaded an operations document: ${file.name}. Please review this and help me optimize my growth and scaling strategy based on its contents.`);
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
              <TrendingUp className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm truncate">Growth Toolkit</span>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80 md:w-96 max-h-[70vh] overflow-y-auto">
          <DropdownMenuLabel className="text-sm font-semibold">
            🚀 Growth Engine Toolkit
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
            Scaling Strategies
          </DropdownMenuLabel>
          {scalingStrategies.map((strategy) => (
            <DropdownMenuItem
              key={strategy.id}
              onClick={() => onTemplateSelect(strategy.prompt)}
              className="flex items-start p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              <div className="mr-3 mt-0.5 text-purple-600">{strategy.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{strategy.title}</div>
                <div className="text-xs text-gray-500 mt-1">{strategy.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
            Operations Excellence
          </DropdownMenuLabel>
          {operationsOptimization.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => onTemplateSelect(option.prompt)}
              className="flex items-start p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              <div className="mr-3 mt-0.5 text-purple-600">{option.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{option.title}</div>
                <div className="text-xs text-gray-500 mt-1">{option.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
            Team & Culture
          </DropdownMenuLabel>
          {teamGrowthStrategies.map((strategy) => (
            <DropdownMenuItem
              key={strategy.id}
              onClick={() => onTemplateSelect(strategy.prompt)}
              className="flex items-start p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              <div className="mr-3 mt-0.5 text-purple-600">{strategy.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{strategy.title}</div>
                <div className="text-xs text-gray-500 mt-1">{strategy.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
            Technology Infrastructure
          </DropdownMenuLabel>
          {technologyInfrastructure.map((tech) => (
            <DropdownMenuItem
              key={tech.id}
              onClick={() => onTemplateSelect(tech.prompt)}
              className="flex-col items-start p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              <div className="font-medium text-sm">{tech.title}</div>
              <div className="text-xs text-gray-500 mt-1">{tech.description}</div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
            Document Tools
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={handleFileUpload}
            className="flex items-center p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20"
          >
            <Upload className="h-4 w-4 mr-3 text-purple-600" />
            <div>
              <div className="font-medium text-sm">Upload Operations Document</div>
              <div className="text-xs text-gray-500">Upload process docs, org charts, or performance data</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}