# Claude Code GitHub Integration Guide

This guide explains how Claude Code is integrated into this repository through GitHub Actions workflows, enabling AI-powered development assistance and automated code reviews.

## Table of Contents
- [Overview](#overview)
- [Workflows](#workflows)
  - [Claude Code Review](#claude-code-review)
  - [Claude Code Development](#claude-code-development)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [Configuration](#configuration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

This repository uses Claude Code, Anthropic's AI coding assistant, through two main GitHub Actions workflows:

1. **Automated PR Reviews**: Claude reviews pull requests and provides feedback on code quality, bugs, and best practices
2. **Issue-based Development**: Claude can implement features and fixes based on GitHub issues

## Workflows

### Claude Code Review

**File**: `.github/workflows/claude-code-review.yml`

This workflow automatically reviews pull requests when they're opened or updated.

#### Features:
- Runs on every new PR and subsequent pushes
- Reviews code quality, security, performance, and test coverage
- Posts feedback directly as PR comments
- Uses Claude Sonnet 4 by default (configurable to Opus 4)

#### What Claude Reviews:
- Code quality and best practices
- Potential bugs or issues
- Performance considerations
- Security concerns
- Test coverage

### Claude Code Development

**File**: `.github/workflows/claude.yml`

This workflow allows Claude to implement features and fixes based on GitHub issues.

#### Features:
- Triggered by mentioning `@claude` in issue comments
- Can create branches, write code, and open PRs
- Follows the project's coding standards (via CLAUDE.md)
- Includes safety checks and human approval steps

#### Capabilities:
- Read and modify files
- Run tests and linting
- Create comprehensive PRs with proper descriptions
- Follow project-specific guidelines

## Setup Instructions

### 1. Install Claude Code GitHub App

1. Visit [Claude Code GitHub App](https://github.com/apps/claude-code)
2. Click "Install" and select your repository
3. Grant necessary permissions

### 2. Add Required Secrets

In your repository settings, add these secrets:

```
CLAUDE_CODE_OAUTH_TOKEN - Provided after installing the GitHub App
```

### 3. Verify Installation

Create a test issue with the comment:
```
@claude can you help me understand this codebase?
```

## Usage

### Getting Code Reviews

Claude automatically reviews all PRs. No action needed! Claude will comment with:
- Code quality feedback
- Bug identification
- Performance suggestions
- Security concerns
- Test coverage analysis

### Requesting Development Help

1. Create or comment on an issue
2. Mention `@claude` with your request:

```markdown
@claude please add a dark mode toggle to the settings page
```

```markdown
@claude can you fix the bug where users can't save their preferences?
```

```markdown
@claude please refactor the authentication module to use the new API
```

### Claude's Development Process

When you request help, Claude will:
1. Analyze the request and codebase
2. Create a new branch
3. Implement the changes
4. Run tests and linting
5. Create a PR with detailed description
6. Request your review

## Configuration

### Customizing Code Reviews

Edit `.github/workflows/claude-code-review.yml`:

```yaml
# Use Claude Opus 4 for more thorough reviews
model: "claude-opus-4-20250514"

# Customize review focus
direct_prompt: |
  Focus on:
  - TypeScript best practices
  - React performance optimization
  - Accessibility concerns
  - Security vulnerabilities

# Only review certain files
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"

# Skip reviews for certain authors
if: |
  github.event.pull_request.user.login != 'dependabot[bot]'
```

### Customizing Development Workflow

Edit `.github/workflows/claude.yml`:

```yaml
# Give Claude access to specific tools
allowed_tools: "Bash(npm test),Bash(npm run lint),Read,Write,Edit"

# Use Claude Opus 4 for complex tasks
model: "claude-opus-4-20250514"

# Add pre-task instructions
system_prompt: |
  Always follow our coding standards.
  Ensure all new code has tests.
  Use TypeScript strict mode.
```

### Project Guidelines (CLAUDE.md)

Claude follows instructions in `/CLAUDE.md`. Update this file to:
- Define coding standards
- Specify testing requirements
- List common commands
- Explain project architecture
- Set development guidelines

## Best Practices

### For Code Reviews

1. **Label PRs appropriately**: Use labels like `skip-review` to skip Claude's review
2. **Be specific in PR descriptions**: Help Claude understand context
3. **Respond to Claude's feedback**: Engage with suggestions
4. **Use draft PRs**: Mark as draft if not ready for review

### For Development Requests

1. **Be specific**: Clear requirements get better results
   ```
   ❌ "Fix the bug"
   ✅ "Fix the bug where clicking 'Save' doesn't update user preferences"
   ```

2. **Provide context**: Include error messages, expected behavior
   ```
   @claude The login form throws a 500 error when submitting with special characters. 
   Expected: Validation error
   Actual: Server crash
   ```

3. **Break down large tasks**: Request smaller, focused changes
   ```
   ❌ "Redesign the entire dashboard"
   ✅ "Add a widget to show test execution statistics on the dashboard"
   ```

4. **Review Claude's PRs promptly**: Provide feedback to improve future work

### Security Considerations

- Claude never commits directly to main
- All changes go through PR review
- Sensitive files should be added to `.claudeignore`
- Review Claude's changes for security implications

## Troubleshooting

### Claude Not Responding

1. Check workflow runs in Actions tab
2. Verify `CLAUDE_CODE_OAUTH_TOKEN` is set
3. Ensure Claude was mentioned correctly: `@claude`
4. Check if workflow has required permissions

### Poor Code Quality

1. Update CLAUDE.md with clearer guidelines
2. Provide more specific instructions in requests
3. Consider using Claude Opus 4 for complex tasks
4. Include examples of desired code style

### Workflow Failures

Check common issues:
- Missing dependencies in package.json
- Incorrect environment variables
- Insufficient GitHub permissions
- Rate limiting (wait and retry)

### Getting Help

- Check workflow logs in GitHub Actions
- Review [Claude Code documentation](https://docs.anthropic.com/claude-code)
- Open an issue in this repository
- Contact Anthropic support for Claude-specific issues

## Example Requests

### Feature Implementation
```
@claude please add a search feature to the test cases page that allows filtering by:
- Test case name
- Priority (High, Medium, Low)
- Status (Passed, Failed, Not Run)
Include debouncing for the search input.
```

### Bug Fix
```
@claude there's a bug in src/lib/github.ts where rate limiting isn't handled properly. 
It should retry with exponential backoff when hitting 429 errors.
Please fix this and add tests.
```

### Refactoring
```
@claude please refactor the TestCaseForm component to use React Hook Form 
instead of manual state management. Ensure all validations still work.
```

### Documentation
```
@claude please add JSDoc comments to all public methods in src/lib/testcase-manager.ts
Include parameter descriptions and return types.
```

## Advanced Configuration

### Conditional Reviews

Only review PRs to main or with specific labels:
```yaml
if: |
  github.base_ref == 'main' || 
  contains(github.event.pull_request.labels.*.name, 'needs-review')
```

### Custom Review Templates

Different prompts for different file types:
```yaml
direct_prompt: |
  For TypeScript files: Check type safety and interfaces
  For API routes: Verify authentication and error handling  
  For components: Review accessibility and performance
  For tests: Ensure edge cases are covered
```

### Tool Restrictions

Limit Claude's capabilities for safety:
```yaml
# Read-only mode for reviews
allowed_tools: "Read,Grep,Glob"

# Full access for trusted repositories  
allowed_tools: "Read,Write,Edit,Bash,TodoWrite"
```

## Monitoring and Metrics

Track Claude's performance:
1. Review cycle time reduction
2. Bug detection rate
3. Code quality improvements
4. Developer satisfaction

Monitor in GitHub Insights and Actions metrics.

---

## Contributing

To improve Claude's integration:
1. Update CLAUDE.md with lessons learned
2. Refine workflow configurations
3. Share successful patterns
4. Report issues or suggestions

For more information, see the [Claude Code documentation](https://docs.anthropic.com/claude-code).