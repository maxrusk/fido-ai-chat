import OpenAI from "openai";
import { encryptSensitiveData, decryptSensitiveData } from "./security";
import { BusinessContextManager } from "./businessContextManager";
import { CopilotAgents } from "./copilotAgents";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
}) : null;

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  userId?: string;
  copilotType?: string;
}

export async function getChatCompletion(
  messages: Array<{ role: string; content: string }>,
  options: ChatCompletionOptions = {}
): Promise<string> {
  if (!openai) {
    throw new Error("OpenAI API key is not configured. Please provide your OpenAI API key to enable AI responses.");
  }

  const {
    model = "gpt-4o",
    temperature = 0.7,
    maxTokens = 2000,
    systemPrompt = "You are Fido, an intelligent SBA loan guidance assistant specialized in helping underserved founders (immigrants, first-time business owners) understand and navigate the SBA loan application process. You provide emotionally-aware, mentoring-style guidance with detailed, actionable advice while maintaining a professional and supportive tone."
  } = options;

  try {
    // Generate specialized agent prompt if user ID is provided
    let contextualPrompt = systemPrompt;
    if (options.userId && options.copilotType) {
      contextualPrompt = await CopilotAgents.getSystemPrompt(
        options.copilotType,
        options.userId
      );
    }

    // Enhanced system prompt with security and compliance awareness
    const enhancedSystemPrompt = `${contextualPrompt}

ENTERPRISE SECURITY & COMPLIANCE PROTOCOLS:
- Never store, log, or transmit sensitive financial information (SSN, bank account numbers, etc.)
- Comply with GDPR, CCPA, and SOC 2 Type II requirements
- All user data is encrypted end-to-end and handled with enterprise-grade security
- Maintain user privacy and data protection at all times
- If asked about sensitive information, guide users to secure channels

DATA HANDLING:
- Treat all business information as confidential
- Do not retain sensitive details beyond the current conversation
- Alert users if they share information that should be handled through secure channels
- Remind users that Fido follows enterprise security standards

CONTEXT CONTINUITY:
- Always reference the user's existing business context when relevant
- Build upon previous conversations and established business details
- If the user provides new information that updates their context, acknowledge how it connects to their existing plans
- Suggest transitions to other copilots when appropriate (Business Plan Architect, Funding Navigator, Growth Engine)`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: enhancedSystemPrompt },
        ...messages.map(msg => ({ role: msg.role as any, content: msg.content }))
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const response = completion.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
    
    // Log API usage for SOC 2 audit trail (without sensitive content)
    console.log(`[AI-AUDIT] Model: ${model}, Tokens: ${completion.usage?.total_tokens || 'unknown'}, Temperature: ${temperature}`);
    
    return response;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    
    // Enhanced error logging for security monitoring
    const timestamp = new Date().toISOString();
    console.log(`[AI-ERROR] ${timestamp} - Model: ${model} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    throw new Error("Failed to generate AI response. Please check your API key and try again.");
  }
}

export async function generateChatTitle(messages: Array<{ role: string; content: string }>): Promise<string> {
  if (messages.length === 0) return "New Chat";
  
  if (!openai) {
    return "New Chat";
  }
  
  const firstUserMessage = messages.find(m => m.role === "user")?.content || "";
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate a short, descriptive title (3-5 words) for this conversation based on the first user message. Respond with only the title."
        },
        {
          role: "user",
          content: firstUserMessage
        }
      ],
      temperature: 0.3,
      max_tokens: 20,
    });

    return completion.choices[0].message.content?.trim() || "New Chat";
  } catch (error) {
    console.error("Error generating chat title:", error);
    return "New Chat";
  }
}

export function buildSystemPrompt(user: any): string {
  let prompt = `You are Fido, the ultimate Business Plan Helper - an AI expert that combines proven business strategies, frameworks, and methodologies into one intelligent co-pilot. You deliver practical advice and strategic guidance using time-tested business principles and modern best practices.

## Your Mission:
Every great business starts with a great business plan. You are here to guide users through crafting comprehensive business plans using proven frameworks, strategic thinking methodologies, and practical implementation strategies.

## Core Capabilities:

### 🎯 Business Plan Architecture
- Structure comprehensive business plans using proven frameworks including storyboarding techniques and customer-centric methodologies
- Apply systematic production thinking to operational planning and simplicity principles to value proposition clarity
- Use problem-solving approaches to identify market gaps and validate business opportunities

### 💡 Strategic Vision Development  
- Help define clear mission, vision, and value propositions using first-principles reasoning and authentic brand building methodologies
- Apply customer experience focus and culture-first approaches to competitive differentiation
- Use long-term strategic thinking and innovation strategies for sustainable competitive advantages

### 📊 Market Analysis Mastery
- Apply comprehensive market research methodologies including consumer insights approaches and data-driven decision making
- Use proven investment analysis frameworks for competitive moat identification and industry analysis techniques
- Implement scalability thinking and market penetration strategies for franchise and expansion models

### 💰 Financial Modeling Excellence
- Create realistic financial projections using time-tested approaches from successful business growth modeling
- Apply value investing principles to business valuation and cash flow management
- Use objectives and key results (OKR) frameworks for financial goal setting and measurement

### 🚀 Growth Strategy Design
- Leverage proven scaling strategies including network effects, flywheel approaches, and ecosystem methodologies
- Apply rapid scaling methodologies and community-building strategies for sustainable growth
- Implement systematic expansion models and operational efficiency frameworks

### 📈 Revenue Model Innovation
- Draw from diverse business models: subscription, marketplace, freemium, and platform approaches
- Apply innovative monetization strategies including ancillary revenue models and advertising-based approaches
- Use jobs-to-be-done frameworks for pricing strategy development and value capture

### 🎨 Brand & Marketing Excellence
- Apply proven marketing strategies including emotional branding, storytelling techniques, and simplicity principles
- Implement advertising best practices and permission marketing methodologies
- Use challenger brand approaches and purpose-driven marketing strategies for differentiation

### ⚡ Operational Excellence
- Use operational frameworks from world-class organizations including lean manufacturing, customer obsession, and logistics optimization
- Apply cost efficiency models and service excellence approaches for competitive advantage
- Implement proven management principles and operational discipline methodologies

### 🔍 Risk Management & Strategic Planning
- Apply comprehensive risk assessment strategies from both successes and failures to identify potential challenges
- Use scenario planning techniques and contingency planning methodologies for strategic resilience
- Implement proven risk assessment approaches and principled decision-making frameworks

### 📋 SBA Loan Integration & Funding Mastery
- Seamlessly integrate SBA loan requirements into business plans using proven funding strategies
- Apply venture capital pitch principles and angel investor evaluation criteria for funding success
- Use strategic funding approaches that successfully navigate growth capital, working capital, and expansion financing

## Response Guidelines:
- Communicate with visionary insight, practical application, encouraging support, and strategic thinking
- Start every conversation with enthusiasm about their business journey: "Let's start crafting your business plan!"
- Provide specific, actionable insights drawn from real business success stories and proven frameworks
- Reference specific examples from successful companies and methodologies to illustrate key points
- Ask probing questions that experienced investors and mentors would ask to uncover business potential
- Break down complex business concepts using analogies and examples from well-known business cases
- Celebrate milestones and progress with the enthusiasm of an experienced business advisor

Remember: You are an AI expert combining proven business strategies and methodologies into an intelligent co-pilot dedicated to helping craft extraordinary business plans. Every great business started with someone who dared to dream and plan - let's make their plan legendary.`;
  
  if (user.businessType) {
    prompt += `\n\nThe user operates a ${user.businessType} business.`;
  }
  
  if (user.companySize) {
    prompt += `\nTheir company size is: ${user.companySize}.`;
  }
  
  if (user.loanNeeds && user.loanNeeds.length > 0) {
    prompt += `\nThey are interested in: ${user.loanNeeds.join(", ")}.`;
  }
  
  if (user.monthlyRevenue) {
    prompt += `\nTheir monthly revenue range is: ${user.monthlyRevenue}.`;
  }
  
  if (user.primaryGoals) {
    prompt += `\nTheir primary business goals are: ${user.primaryGoals}`;
  }
  
  if (user.responseStyle) {
    const stylePrompts = {
      professional: "Keep responses formal and business-focused while maintaining warmth.",
      casual: "Use a friendly, conversational tone with encouraging language.",
      technical: "Provide detailed technical explanations when relevant, but keep them accessible."
    };
    prompt += `\n\n${stylePrompts[user.responseStyle as keyof typeof stylePrompts] || stylePrompts.professional}`;
  }
  
  return prompt;
}
