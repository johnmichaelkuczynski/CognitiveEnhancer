# Overview

TEXT EVALUATOR is a psychological and cognitive analysis application that evaluates written text to determine cognitive capabilities, psychological characteristics, and psychopathological traits. The app provides six analysis modes across three categories (cognitive, psychological, psychopathological), each with short and comprehensive versions. Users can input text through typing, pasting, or uploading files (TXT, DOC, PDF), and the system automatically chunks large texts (>1000 words) for selective analysis. The application streams real-time analysis results from three reliable LLM providers (ZHI 1-3) and allows users to download evaluations as text files.

## Recent Changes (October 2025)
- **AI Chat Feature**: Added comprehensive AI chat interface below the main analysis section with:
  - Large chat area with message history and real-time streaming responses
  - File upload support (Word/PDF) directly into chat
  - Bidirectional text transfer: send input/output to chat, send chat responses back to input
  - Context-aware messaging with optional analysis context inclusion
  - Full unrestricted conversation capability (not limited to discussing analyzed text)
- **CRITICAL FIX - Command Interpretation Issue**: Fixed all protocols to analyze text containing instructions/commands instead of following them. LLMs now treat ALL input as text to be analyzed, not instructions to execute.
- **CRITICAL FIX - Pure Clinical Analysis**: Removed all conversational language and sympathy from protocols. System now operates as a pure clinical instrument without addressing users personally or showing "understanding."
- **CRITICAL FIX - Psychopathological 4-Phase Structure**: Implemented proper 4-phase long analysis producing 4 separate, distinct reports (Phase 1: Initial Assessment, Phase 2: Pushback Protocol, Phase 3: Walmart Metric, Phase 4: Final Validation).
- **CRITICAL FIX - Placeholder Score Elimination**: Removed all placeholder scores (N/100, [X]/100) and lazy shortcuts. System now demands actual numerical scores (73/100, 85/100, etc.) and complete individual answers to every question.
- **CRITICAL FIX - Complete Analysis Enforcement**: Eliminated all "[Continue for ALL questions...]" and "[Evaluate rest of...]" shortcuts. Every question must be answered individually with direct quotes.
- **Never Refuse Analysis Protocol**: All modes now have explicit "NEVER REFUSE" directives ensuring analysis of any submitted text regardless of content.
- **ZHI 4 (Perplexity) Re-Added**: Successfully implemented Perplexity API integration using llama-3.1-sonar-small-128k-online model with proper streaming support and markdown cleanup.
- **Enhanced Cognitive Assessment**: All providers now implement the complete 18-question cognitive evaluation protocol with proper Q&A formatting.
- **Real-Time Streaming Perfected**: Successfully implemented true real-time streaming where text appears incrementally as LLMs generate it (like ChatGPT/Claude), with immediate React state updates and no buffering delays.
- **Mandatory Quote Requirements**: All analysis modes now enforce minimum quote requirements - at least one quote per question, two quotes minimum for introduction and conclusion sections.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client uses **React with TypeScript** and **Vite** as the build tool, implementing a component-based architecture with shadcn/ui for the design system. The UI follows a clean, white, and spacious layout with large input and output areas positioned side by side. Key architectural decisions include:

- **Routing**: Uses Wouter for lightweight client-side routing
- **State Management**: React hooks for local state, TanStack Query for server state management
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **File Handling**: Drag-and-drop functionality with real-time file processing
- **Streaming**: EventSource-like implementation for real-time analysis result streaming

## Backend Architecture
The server implements a **Node.js Express** architecture with TypeScript, focusing on modularity and separation of concerns:

- **Service Layer**: Dedicated services for LLM interactions and file processing
- **Routing**: RESTful API endpoints with proper error handling
- **File Processing**: Multer for file uploads with support for multiple formats
- **Streaming**: Server-Sent Events (SSE) for real-time analysis streaming
- **Validation**: Zod schemas for request/response validation

## Data Flow
- **Text Input**: Users can type, paste, or upload files through a unified interface
- **Chunking**: Large texts are automatically divided into ~1000-word chunks
- **Analysis Pipeline**: Selected chunks are sent to chosen LLM provider with appropriate prompts
- **Streaming Response**: Analysis results stream back to the client in real-time
- **Export**: Complete analyses can be downloaded as text files
- **AI Chat**: Separate unrestricted chat interface with file upload support and bidirectional text transfer with main analysis interface

## Database Design
Uses **Drizzle ORM** with PostgreSQL for data persistence:
- Schema definitions in shared folder for type safety
- Connection through Neon Database serverless driver
- Migration system for schema management

# External Dependencies

## LLM Providers
- **OpenAI API** (ZHI 1) - GPT-4 with streaming support
- **Anthropic API** (ZHI 2) - Claude Sonnet 4 with clean streaming output
- **DeepSeek API** (ZHI 3) - R1 model with enhanced markdown cleanup
- **Perplexity API** (ZHI 4) - llama-3.1-sonar-small-128k-online with real-time streaming

## Database Services
- **Neon Database** - Serverless PostgreSQL hosting
- **Drizzle ORM** - Type-safe database operations

## File Processing
- **Multer** - File upload handling
- **PDF Processing** - Extract text from PDF documents
- **Word Document Processing** - Handle .doc and .docx files

## UI Framework
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Pre-built component system
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon system

## Development Tools
- **Vite** - Build tool and development server
- **TypeScript** - Type safety across the stack
- **ESBuild** - Fast bundling for production
- **Replit Integration** - Development environment support