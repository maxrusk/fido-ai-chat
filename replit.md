# Fido - The Ultimate Business Plan Helper

## Overview
Fido is a full-stack web application designed as an intelligent co-pilot for business plan development. It aims to guide entrepreneurs in crafting comprehensive business plans by leveraging strategic thinking and frameworks from successful business minds through a conversational AI interface. Fido provides agentic intelligence for funding, credit building, smarter planning, and growth, envisioning itself as a strategic assistant for entrepreneurs.

## User Preferences
Preferred communication style: Simple, everyday language.
User interface descriptions: Direct and pragmatic (e.g., "Business Architect: Create a legendary business plan") rather than flowery language.
System prompts: Keep channeling collective wisdom of greatest business minds behind the scenes for AI capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, Vite for building.
- **UI/Styling**: Radix UI components with shadcn/ui and Tailwind CSS. Supports dark mode with custom design tokens.
- **State Management**: TanStack Query for data fetching and state.
- **Routing**: Wouter.
- **Form Handling**: React Hook Form with Zod validation.
- **Design Decisions**: Contemporary AI-tech marketing style, incorporating neo-brutalism, post-minimalism, and pixel surrealism. Features an off-white background with soft purples and oranges, pixelated gradients, tactile neo-brutal cards with bold shadows, and comprehensive micro-interaction animations with pixel effects.
- **UI/UX Features**: Expandable textarea, typewriter effect for AI responses, auto-scroll, seamless agent switching, live business plan document generation with side-by-side layout, interactive business plan template with 9 standard sections, micro-animations for section completions, and intelligent chat categorization with a filter system.

### Backend Architecture
- **Runtime**: Node.js with Express.js server.
- **Language**: TypeScript with ES modules.
- **API Pattern**: RESTful endpoints with WebSocket support for real-time features.
- **Authentication**: Replit Auth (OpenID Connect) with session management.
- **AI Integration**: OpenAI GPT-4o for chat completions using custom system prompts and specialized agent personas.
- **Document Processing**: Enhanced DocumentProcessor supporting PDF, Word, Excel, and text file analysis with lazy loading and deployment-safe fallbacks.

### Database & Storage
- **Database**: PostgreSQL (Neon serverless or Supabase PostgreSQL).
- **ORM**: Drizzle ORM.
- **Session Store**: PostgreSQL-backed session storage using `connect-pg-simple`.
- **Schema**: Includes tables for BusinessPlanBuilder (`business_plans`), LoanNavigator (`loan_applications`), and OpsSpecialist (`operational_suggestions`).
- **Business Context Storage**: Intelligent entity extraction and persistence with auto-save functionality and real-time status indicators.
- **Cross-Copilot Continuity**: Maintains user context and business data seamlessly across specialized co-pilots (Business Plan Builder, Funding Navigator/Capital Architect, Growth Engine).
- **Security & Compliance**: SOC 2 Type II compliant design, end-to-end encryption, GDPR/CCPA data rights, audit trails, and privacy-compliant data deletion workflows. Admin-only analytics access with role-based authorization.

### Key Features
- **AI Integration**: Custom wrapper around OpenAI API with configurable models and enhanced system prompts using business frameworks. Provides proactive Agentic Intelligence for research and content generation.
- **Multi-Agent System**: Three specialized co-pilots, each with distinct system prompts, expertise, and dedicated UI.
- **Business Plan Generation**: Real-time creation and export of business plans, automated content extraction into a 9-section template, progressive completion tracking, and professional PDF generation.
- **Interactive Financial Projections**: AI-powered spreadsheet with real-time calculations, multi-year projections, comprehensive financial metrics, customizable assumptions, and CSV export.
- **Streamlined User Experience**: "Next Section" buttons for controlled navigation without automatic AI responses.
- **Funding & Growth Capabilities**: Funding Navigator for evaluating funding sources and capital stack recommendations; Operational excellence recommendations with categorized advice, cost estimation, and tracking.
- **Authentication System**: Dual support for Replit Auth or Supabase Auth with Google OAuth, secure session/JWT management, and user profiles.
- **Enhanced Chat Experience**: Intelligent chat categorization by business plan sections, allowing filtering and structuring discussions.
- **Analytics & Monitoring**: Comprehensive analytics system with database tracking of user behavior, system metrics, and conversation data. Real-time dashboard with admin-only access.
- **Comprehensive Data Persistence**: Full user data preservation including chat session history, business plan progress, and cross-copilot continuity. Auto-save ensures no data loss.

## External Dependencies

### Core Services
- **OpenAI API**: For AI functionalities (GPT-4o).
- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit Auth**: Authentication and user management.
- **Supabase**: Alternative full-stack service with PostgreSQL, Auth, and Google OAuth.
- **Redis**: For enhanced memory persistence, session caching, and real-time chat memory (optional, with graceful degradation).

### Frontend Libraries
- **React Ecosystem**: React 18.
- **Radix UI**: UI component library.
- **Tailwind CSS**: Styling framework.

### Backend Services
- **Express.js**: Web server framework.
- **WebSocket**: For real-time communication.
- **connect-pg-simple**: For PostgreSQL-backed session storage.
- **pdf-parse**: For PDF document processing.
```