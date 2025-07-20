# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**QA Test Manager** - A comprehensive manual test case management and test runner application built for QA teams working with GitHub. The app integrates with GitHub to fetch issues, uses AI to generate test cases, and provides a complete workflow for organizing and executing manual tests.

## Technology Stack

- **Framework**: Next.js 15.4.2 with App Router and Turbopack
- **Language**: TypeScript with strict typing
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Authentication**: NextAuth.js with GitHub OAuth + Personal Access Token fallback
- **AI Integration**: OpenAI GPT-4 for test case generation
- **GitHub Integration**: Octokit REST API client
- **Data Storage**: File-based system (Markdown + JSON for git-friendly version control)
- **UI Components**: shadcn/ui built on Radix UI primitives

## Development Commands

- **Development server**: `npm run dev` (uses Turbopack for faster builds)
- **Production build**: `npm run build`
- **Start production server**: `npm run start`
- **Linting**: `npm run lint`

## Environment Setup

Required environment variables in `.env.local`:

```bash
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# NextAuth Configuration  
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Optional: GitHub Personal Access Token (fallback)
GITHUB_PAT=your_github_personal_access_token_here
```

## Project Architecture

### Directory Structure
```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/          # NextAuth configuration
│   │   ├── github/                     # GitHub API endpoints
│   │   │   ├── issues/                 # Fetch GitHub issues
│   │   │   └── repositories/           # Fetch GitHub repositories
│   │   └── testcases/generate/         # AI test case generation
│   ├── auth/signin/                    # Authentication pages
│   ├── layout.tsx                      # Root layout with providers
│   └── page.tsx                        # Dashboard homepage
├── components/
│   ├── layout/
│   │   └── navigation.tsx              # Main navigation component
│   ├── providers/
│   │   └── session-provider.tsx        # NextAuth session wrapper
│   └── ui/                             # shadcn/ui components
├── lib/
│   ├── auth.ts                         # Authentication utilities
│   ├── github.ts                       # GitHub API service class
│   ├── openai.ts                       # OpenAI service for test generation
│   ├── types.ts                        # TypeScript type definitions
│   └── utils.ts                        # Utility functions (cn, etc.)
├── testcases/                          # Generated test case markdown files
├── testplans/                          # Test plan JSON files  
└── results/                            # Test execution results JSON files
```

### Core Features Implemented

#### 1. Authentication System
- **GitHub OAuth**: Primary authentication method using NextAuth.js
- **Personal Access Token**: Fallback authentication for users without OAuth setup
- **Protected Routes**: Automatic redirection to signin for unauthenticated users
- **Session Management**: Client and server-side session handling

#### 2. GitHub Integration
- **Repository Access**: Fetch user's GitHub repositories with pagination
- **Issue Management**: Retrieve issues with metadata (labels, state, assignee)
- **REST API**: Complete GitHub REST API integration with error handling
- **Multi-Auth Support**: Works with both OAuth tokens and Personal Access Tokens

#### 3. AI-Powered Test Case Generation
- **OpenAI GPT-4**: Structured prompting for comprehensive test case creation
- **Batch Processing**: Generate multiple test cases from selected GitHub issues
- **Structured Output**: Creates detailed test cases with steps, preconditions, and expected results
- **File Storage**: Saves generated test cases as Markdown files with frontmatter metadata

#### 4. File-Based Data Management
- **Test Cases**: Stored as Markdown files in `/testcases/` with YAML frontmatter
- **Test Plans**: JSON files in `/testplans/` containing test case collections
- **Test Results**: JSON files in `/results/` for execution tracking
- **Git-Friendly**: Version control optimized file formats

#### 5. Modern UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Component Library**: Professional UI using shadcn/ui components
- **Navigation**: Persistent navigation with user authentication state
- **Loading States**: Proper loading indicators and error handling
- **Dashboard**: Overview with statistics and quick actions

### API Endpoints

#### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handlers

#### GitHub Integration  
- `GET /api/github/repositories` - Fetch user repositories
- `GET /api/github/issues?owner={owner}&repo={repo}&state={state}` - Fetch repository issues

#### Test Case Generation
- `POST /api/testcases/generate` - Generate test cases from GitHub issues
  - Body: `{ issueNumbers: number[], repository: string, owner: string }`
  - Returns: Generated test cases with file storage

### Data Models

#### Core Types (see `src/lib/types.ts`)
- **GitHubIssue**: Issue data from GitHub API
- **GitHubRepository**: Repository metadata
- **TestCase**: Complete test case with steps and metadata
- **TestPlan**: Collection of test cases for execution
- **TestRun**: Test execution session with results
- **TestResult**: Individual test case execution results

### Code Patterns

#### Authentication
- Use `useSession()` for client-side auth state
- Use `getServerSession()` for server-side auth
- Support both OAuth and PAT authentication flows
- Check localStorage for GitHub PAT as fallback

#### API Integration
- GitHub API calls use the `GitHubService` class
- OpenAI integration through `OpenAIService` class
- Consistent error handling and response formatting
- Token management for both OAuth and PAT

#### File Operations
- Test cases saved as Markdown with gray-matter frontmatter
- JSON files for structured data (plans, results)
- File naming follows ID-based convention for uniqueness

#### UI Components
- All components use TypeScript with proper type definitions
- shadcn/ui components for consistent design system
- Responsive design with mobile-first approach
- Loading states and error boundaries implemented

### Development Guidelines

#### When Adding New Features
1. Define TypeScript interfaces in `src/lib/types.ts`
2. Create API endpoints in `src/app/api/` following REST conventions
3. Build UI components using shadcn/ui primitives
4. Implement proper error handling and loading states
5. Add comprehensive TypeScript types for all data

#### File Storage Conventions
- Test case files: `{testCaseId}.md` in `/testcases/`
- Test plan files: `{testPlanId}.json` in `/testplans/`
- Result files: `{testRunId}-{timestamp}.json` in `/results/`

#### API Response Patterns
- Always return consistent JSON structure
- Include proper HTTP status codes
- Handle authentication in API middleware
- Support both session tokens and PAT authentication