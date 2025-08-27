# Overview

Cognitive Enhancer is a psychological and cognitive analysis application that evaluates written text to determine cognitive capabilities, psychological characteristics, and psychopathological traits. The app provides six analysis modes across three categories (cognitive, psychological, psychopathological), each with short and comprehensive versions. Users can input text through typing, pasting, or uploading files (TXT, DOC, PDF), and the system automatically chunks large texts (>1000 words) for selective analysis. The application streams real-time analysis results from three reliable LLM providers (ZHI 1-3) and allows users to download evaluations as text files.

## Recent Changes (August 2025)
- **ZHI 4 (Perplexity) Removed**: After extensive debugging attempts, ZHI 4 was completely removed due to persistent formatting issues, text corruption, and API compatibility problems. The application now operates with three fully functional providers.
- **Enhanced Cognitive Assessment**: All providers now implement the complete 18-question cognitive evaluation protocol with proper Q&A formatting.
- **Streamlined Architecture**: Reduced complexity by focusing on three working providers instead of attempting to maintain a problematic fourth option.

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

## Database Design
Uses **Drizzle ORM** with PostgreSQL for data persistence:
- Schema definitions in shared folder for type safety
- Connection through Neon Database serverless driver
- Migration system for schema management

# External Dependencies

## LLM Providers
- **OpenAI API** (ZHI 1) - GPT-5 with sequential chunk processing and 10-second delays
- **Anthropic API** (ZHI 2) - Claude Sonnet 4 with clean streaming output
- **DeepSeek API** (ZHI 3) - R1 model with enhanced markdown cleanup
- **~~Perplexity API (ZHI 4)~~** - *Removed due to persistent formatting and compatibility issues*

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