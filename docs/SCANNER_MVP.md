# Repository Scanner MVP

## Overview
The Repository Scanner is a lightweight tool that analyzes GitHub repositories to provide code quality insights and test recommendations for QA teams.

## Features

### Core Functionality
- **Repository Analysis**: Analyzes code structure, file count, and lines of code
- **Language Detection**: Identifies programming languages used in the repository
- **Technology Stack Detection**: Detects frameworks, tools, and package managers
- **Code Quality Metrics**: Provides basic maintainability and documentation scores
- **Test Suggestions**: Generates basic test recommendations based on repository structure

### User Interface
- Simple input field for GitHub repository URL
- Real-time progress tracking during scans
- Clean results display with key metrics
- Scan history with ability to view previous results

## How to Use

1. Navigate to the Scanner page from the main navigation
2. Enter a GitHub repository URL in one of these formats:
   - `https://github.com/owner/repo`
   - `github.com/owner/repo`  
   - `owner/repo`
3. Click "Start Scan" to begin analysis
4. View real-time progress as the scanner analyzes the repository
5. Review results including:
   - Repository overview
   - Language distribution
   - Quality metrics
   - Test suggestions

## Technical Details

### API Endpoints
- `POST /api/scanner` - Start a new scan
- `GET /api/scanner` - Get scan history
- `GET /api/scanner?id={scanId}` - Get specific scan results

### Data Storage
- Currently uses in-memory storage (MVP)
- Production version would use persistent database

### Scan Process
1. Fetches repository metadata from GitHub
2. Analyzes file tree structure
3. Calculates code metrics
4. Detects technologies and frameworks
5. Generates test suggestions
6. Returns comprehensive results

## Limitations (MVP)
- No AI-powered insights (can be added later)
- Basic technology detection (heuristic-based)
- In-memory storage (data lost on server restart)
- Simple quality metrics calculation
- Limited to public repositories or those accessible with user's token

## Future Enhancements
- AI-powered code analysis and insights
- Advanced security scanning
- Performance analysis
- Persistent storage with database
- Export functionality for scan results
- Integration with test case generation
- Real-time repository monitoring
- Advanced visualizations and charts