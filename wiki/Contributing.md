# Contributing Guide

Welcome to QA Test Manager! We're excited that you want to contribute to making manual testing more efficient and enjoyable.

## 🤝 Ways to Contribute

### Code Contributions
- **Bug fixes**: Help resolve reported issues
- **Feature development**: Add new functionality
- **Performance improvements**: Optimize existing code
- **Test coverage**: Add or improve tests
- **Documentation**: Improve code documentation

### Non-Code Contributions
- **Bug reports**: Identify and report issues
- **Feature requests**: Suggest new features
- **Documentation**: Improve user guides and wiki
- **Design feedback**: UI/UX suggestions
- **Community support**: Help other users

### Translation (Future)
- **Internationalization**: Help translate the interface
- **Localization**: Adapt for different regions

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:
- **Node.js 18+** installed
- **Git** configured with your GitHub account
- **GitHub account** for pull requests
- **Code editor** (VS Code recommended)

### Development Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR-USERNAME/qa-demo-1.git
   cd qa-demo-1
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/synjan/qa-demo-1.git
   git remote -v
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Verify setup**
   - Open http://localhost:3000
   - Check that authentication works
   - Create a test case to verify functionality

## 🌊 Development Workflow

### Creating a Feature Branch

1. **Sync with upstream**
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-new-feature
   # or
   git checkout -b fix/bug-description
   ```

### Making Changes

1. **Follow coding standards** (see below)
2. **Write tests** for new functionality
3. **Update documentation** as needed
4. **Test thoroughly** before submitting

### Committing Changes

We use conventional commits for clear history:

```bash
# Feature
git commit -m "feat: add batch test execution with progress tracking"

# Bug fix
git commit -m "fix: resolve test case loading issue with special characters"

# Documentation
git commit -m "docs: update API reference with new endpoints"

# Refactor
git commit -m "refactor: simplify test result storage logic"

# Tests
git commit -m "test: add unit tests for file utilities"
```

#### Commit Types
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code formatting (no logic changes)
- `refactor`: Code restructuring (no feature changes)
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### Creating Pull Requests

1. **Push your branch**
   ```bash
   git push origin feature/amazing-new-feature
   ```

2. **Create pull request**
   - Go to GitHub and click "New Pull Request"
   - Use clear, descriptive title
   - Fill out the PR template completely
   - Link to related issues

3. **PR Template** (auto-populated):
   ```markdown
   ## Summary
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Tests pass locally
   - [ ] New tests added (if applicable)
   - [ ] Manual testing completed
   
   ## Screenshots (if applicable)
   
   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No breaking changes (or clearly documented)
   ```

## 📝 Coding Standards

### TypeScript Guidelines

```typescript
// Use explicit types for function parameters and returns
function createTestCase(data: TestCaseInput): Promise<TestCase> {
  // Implementation
}

// Use interfaces for object types
interface TestCaseInput {
  title: string;
  description: string;
  priority: Priority;
  steps: TestStep[];
}

// Use type unions for specific values
type Priority = 'critical' | 'high' | 'medium' | 'low';

// Use optional properties with ?
interface TestCaseOptions {
  tags?: string[];
  githubIssue?: string;
}
```

### React Component Guidelines

```typescript
// Use functional components with TypeScript
interface TestCaseCardProps {
  testCase: TestCase;
  onEdit: (id: string) => void;
  onRun: (id: string) => void;
}

export function TestCaseCard({ testCase, onEdit, onRun }: TestCaseCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{testCase.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  );
}

// Use proper prop destructuring
// Use semantic HTML elements
// Follow accessibility guidelines
```

### File Organization

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Route groups
│   ├── api/               # API routes
│   ├── testcases/         # Test case pages
│   │   ├── page.tsx       # List page
│   │   ├── new/           # New test case
│   │   └── [id]/          # Dynamic routes
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── layout/           # Layout components
│   ├── forms/            # Form components
│   └── specialized/      # Domain-specific components
├── lib/                  # Utilities and shared logic
│   ├── types.ts          # Type definitions
│   ├── utils.ts          # General utilities
│   ├── file-utils.ts     # File operations
│   └── api-client.ts     # API client
└── hooks/               # Custom React hooks
```

### Naming Conventions

```typescript
// Files: kebab-case
test-case-form.tsx
file-utils.ts
api-client.ts

// Components: PascalCase
TestCaseForm
BatchRunner
NavigationHeader

// Functions: camelCase
createTestCase
executeTestStep
generateReport

// Constants: UPPER_SNAKE_CASE
const MAX_TEST_CASES = 1000;
const DEFAULT_PRIORITY = 'medium';

// Types/Interfaces: PascalCase
interface TestCase { }
type ExecutionStatus = 'pass' | 'fail';
```

### CSS and Styling

```css
/* Use Tailwind CSS classes primarily */
<div className="flex items-center justify-between p-4 bg-card border rounded-lg">

/* Use semantic color variables */
<div className="text-foreground bg-background border-border">

/* Use responsive design */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

/* Custom CSS only when necessary */
.custom-scroll {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted)) transparent;
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test test-case-utils.test.ts
```

### Writing Tests

```typescript
// Unit test example
import { parseTestSteps } from '@/lib/file-utils';

describe('parseTestSteps', () => {
  it('should parse markdown test steps correctly', () => {
    const markdown = `
## Test Steps
1. **Action**: Click login button
   **Expected Result**: Login form appears
    `;
    
    const steps = parseTestSteps(markdown);
    
    expect(steps).toHaveLength(1);
    expect(steps[0].action).toBe('Click login button');
    expect(steps[0].expectedResult).toBe('Login form appears');
  });
  
  it('should handle empty markdown', () => {
    const steps = parseTestSteps('');
    expect(steps).toHaveLength(0);
  });
});

// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { TestCaseCard } from '@/components/test-case-card';

describe('TestCaseCard', () => {
  const mockTestCase = {
    id: 'tc-001',
    title: 'Test Login',
    description: 'Test user login functionality',
    priority: 'high' as const,
    steps: []
  };
  
  it('should render test case information', () => {
    render(
      <TestCaseCard 
        testCase={mockTestCase} 
        onEdit={() => {}} 
        onRun={() => {}} 
      />
    );
    
    expect(screen.getByText('Test Login')).toBeInTheDocument();
    expect(screen.getByText('Test user login functionality')).toBeInTheDocument();
  });
  
  it('should call onRun when run button is clicked', () => {
    const onRun = jest.fn();
    
    render(
      <TestCaseCard 
        testCase={mockTestCase} 
        onEdit={() => {}} 
        onRun={onRun} 
      />
    );
    
    fireEvent.click(screen.getByText('Run'));
    expect(onRun).toHaveBeenCalledWith('tc-001');
  });
});
```

### Test Categories

1. **Unit Tests**: Test individual functions and utilities
2. **Component Tests**: Test React components in isolation
3. **Integration Tests**: Test component interactions
4. **API Tests**: Test API endpoints
5. **E2E Tests**: Test complete user workflows (future)

## 📚 Documentation

### Code Documentation

```typescript
/**
 * Creates a new test case and saves it to the file system
 * 
 * @param testCaseData - The test case data to create
 * @returns Promise that resolves to the created test case with generated ID
 * 
 * @example
 * ```typescript
 * const testCase = await createTestCase({
 *   title: 'Login Test',
 *   description: 'Test user login functionality',
 *   priority: 'high',
 *   steps: [
 *     { action: 'Enter credentials', expectedResult: 'User logged in' }
 *   ]
 * });
 * ```
 */
export async function createTestCase(testCaseData: TestCaseInput): Promise<TestCase> {
  // Implementation
}
```

### Component Documentation

```typescript
/**
 * TestCaseCard displays a test case with actions for editing and running
 * 
 * @component
 * @example
 * ```tsx
 * <TestCaseCard
 *   testCase={testCase}
 *   onEdit={(id) => router.push(`/testcases/${id}/edit`)}
 *   onRun={(id) => router.push(`/testcases/${id}/run`)}
 * />
 * ```
 */
interface TestCaseCardProps {
  /** The test case to display */
  testCase: TestCase;
  /** Callback when edit button is clicked */
  onEdit: (id: string) => void;
  /** Callback when run button is clicked */
  onRun: (id: string) => void;
}
```

### README Updates

When adding features, update relevant documentation:
- Main README.md
- API documentation
- User guide
- This contributing guide

## 🐛 Bug Reports

### Good Bug Reports Include

1. **Clear title**: Summarize the issue
2. **Environment**: OS, Node.js version, browser
3. **Steps to reproduce**: Numbered list
4. **Expected behavior**: What should happen
5. **Actual behavior**: What actually happens
6. **Screenshots**: For visual issues
7. **Console logs**: Any error messages
8. **Additional context**: Anything else relevant

### Bug Report Template

```markdown
**Bug Description**
A clear description of what the bug is.

**To Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
A clear description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. macOS, Windows, Ubuntu]
 - Browser [e.g. chrome, safari]
 - Node.js version [e.g. 18.17.0]
 - App version [e.g. 0.1.0]

**Additional Context**
Add any other context about the problem here.
```

## ✨ Feature Requests

### Good Feature Requests Include

1. **Problem statement**: What problem does this solve?
2. **Proposed solution**: How should it work?
3. **Alternatives**: Other ways to solve the problem
4. **Use cases**: Who would use this feature?
5. **Priority**: How important is this feature?

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
A clear description of any alternative solutions or features you've considered.

**Use Cases**
Describe who would use this feature and how.

**Additional Context**
Add any other context or screenshots about the feature request here.
```

## 🏗️ Architecture Guidelines

### State Management

```typescript
// Use React state for local component state
const [isLoading, setIsLoading] = useState(false);

// Use custom hooks for shared logic
function useTestCases() {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  
  const loadTestCases = useCallback(async () => {
    // Implementation
  }, []);
  
  return { testCases, loadTestCases };
}

// Use Context for global state (sparingly)
const ThemeContext = createContext<ThemeContextValue>();
```

### API Design

```typescript
// RESTful API design
GET    /api/testcases           # List test cases
POST   /api/testcases           # Create test case
GET    /api/testcases/:id       # Get test case
PUT    /api/testcases/:id       # Update test case
DELETE /api/testcases/:id       # Delete test case

// Consistent response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

### Error Handling

```typescript
// Client-side error handling
try {
  const response = await fetch('/api/testcases');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Failed to fetch test cases:', error);
  throw error;
}

// Server-side error handling
export async function GET(request: Request) {
  try {
    const testCases = await loadTestCases();
    return NextResponse.json(testCases);
  } catch (error) {
    console.error('Error loading test cases:', error);
    return NextResponse.json(
      { error: 'Failed to load test cases' },
      { status: 500 }
    );
  }
}
```

## 🔍 Code Review Process

### For Contributors

1. **Self-review** your code before submitting
2. **Test thoroughly** on different browsers/devices
3. **Update documentation** for any changes
4. **Respond promptly** to review feedback
5. **Make requested changes** in new commits

### Review Checklist

- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Performance considerations addressed
- [ ] Accessibility guidelines followed
- [ ] Security implications considered

### Getting Reviews

1. **Request review** from maintainers
2. **Be patient** - reviews take time
3. **Address feedback** constructively
4. **Ask questions** if feedback is unclear
5. **Learn from feedback** for future contributions

## 🎯 Priority Areas

### High Priority
- **Bug fixes**: Resolve existing issues
- **Test coverage**: Improve automated testing
- **Performance**: Optimize slow operations
- **Accessibility**: Ensure WCAG compliance

### Medium Priority
- **New features**: Add requested functionality
- **Documentation**: Improve user guides
- **Developer experience**: Better dev tools
- **Internationalization**: Multi-language support

### Future Considerations
- **Database support**: PostgreSQL, MySQL integration
- **Real-time features**: WebSocket support
- **Mobile app**: React Native version
- **Enterprise features**: SSO, advanced permissions

## 🏆 Recognition

### Contributors

All contributors are recognized:
- **Contributors file**: Listed in CONTRIBUTORS.md
- **Release notes**: Mentioned in release announcements
- **GitHub insights**: Visible in repository statistics
- **Community**: Recognized in discussions

### Maintainer Path

Regular contributors may be invited to become maintainers:
- **Code quality**: Consistent high-quality contributions
- **Community involvement**: Helping other contributors
- **Expertise**: Deep understanding of the codebase
- **Reliability**: Sustained involvement over time

## 📞 Questions?

### Getting Help

- **GitHub Discussions**: Ask questions about contributing
- **Discord/Slack**: Real-time chat with maintainers (future)
- **Email**: Contact maintainers directly
- **Pair programming**: Schedule sessions with maintainers

### Communication Guidelines

- **Be respectful**: Treat everyone with respect
- **Be constructive**: Provide helpful feedback
- **Be patient**: Allow time for responses
- **Be clear**: Communicate clearly and concisely

---

Thank you for contributing to QA Test Manager! Your efforts help make manual testing better for everyone. 🎉

**Happy coding!** 🚀