# User Manual

Complete guide to using QA Test Manager for manual testing workflows.

## 📋 Table of Contents

1. [Getting Started](#-getting-started)
2. [Test Case Management](#-test-case-management)
3. [Test Execution](#-test-execution)
4. [Test Plans](#-test-plans)
5. [Dashboard Analytics](#-dashboard-analytics)
6. [GitHub Integration](#-github-integration)
7. [Batch Operations](#-batch-operations)
8. [Export and Reporting](#-export-and-reporting)
9. [Settings and Customization](#-settings-and-customization)

## 🚀 Getting Started

### First Login

1. **Navigate** to your QA Test Manager instance
2. **Click "Sign In"** in the top navigation
3. **Authenticate** with your GitHub account
4. **Grant permissions** when prompted
5. **Return** to the application dashboard

### Interface Overview

The main interface consists of:
- **Navigation Bar** - Access main sections and user menu
- **Dashboard** - Overview of statistics and recent activity
- **Test Cases** - Manage individual test cases
- **Test Plans** - Organize test cases into plans
- **GitHub Issues** - Browse and generate tests from issues

## 📝 Test Case Management

### Creating Test Cases Manually

#### From the Test Cases Page

1. **Navigate** to "Test Cases" in the main menu
2. **Click "New Test Case"** button
3. **Fill in the form**:
   
   | Field | Description | Required |
   |-------|-------------|----------|
   | Title | Short descriptive name | Yes |
   | Description | Detailed explanation | Yes |
   | Priority | Critical, High, Medium, Low | Yes |
   | Preconditions | Setup requirements | No |
   | Tags | Categorization labels | No |
   | GitHub Issue | Link to related issue | No |

4. **Add test steps**:
   - Click "Add Step"
   - Enter **Action** (what to do)
   - Enter **Expected Result** (what should happen)
   - Repeat for each step

5. **Save the test case**

#### Test Case Properties

**Metadata Fields:**
- **ID**: Auto-generated unique identifier
- **Title**: Descriptive name (e.g., "User Login Validation")
- **Description**: Detailed explanation of what's being tested
- **Priority**: Impact level (Critical, High, Medium, Low)
- **Preconditions**: Setup required before testing
- **Tags**: Labels for categorization and filtering
- **GitHub Issue**: Optional link to related GitHub issue

**Test Steps:**
Each step contains:
- **Action**: What the tester should do
- **Expected Result**: What should happen when the action is performed

### Editing Test Cases

1. **Find the test case** in the test cases list
2. **Click the "Edit" button**
3. **Modify any field** or add/remove steps
4. **Save changes**

All changes are automatically versioned in the file system.

### Viewing Test Cases

#### List View
- **Search** by title, description, or step content
- **Filter** by priority, tags, or execution status
- **Sort** by creation date, priority, or title
- **Select multiple** for batch operations

#### Detail View
- **Complete test case information**
- **Step-by-step breakdown**
- **Execution history**
- **Related GitHub issues**

## 🏃‍♂️ Test Execution

### Individual Test Execution

#### Starting a Test Run

1. **Navigate** to the test case
2. **Click "Run Test"** button
3. **Review** preconditions and test details
4. **Click "Start Test Execution"**

#### Executing Steps

For each test step:

1. **Read the Action** - Understand what to do
2. **Perform the Action** - Execute the step
3. **Check Expected Result** - Verify the outcome
4. **Record the Result**:
   - **Pass** ✅ - Step worked as expected
   - **Fail** ❌ - Step did not work as expected
   - **Blocked** ⚠️ - Cannot proceed due to external issue
   - **Skip** ⏭️ - Step not applicable in current context

#### Adding Notes

- **Optional but recommended** for failed or blocked steps
- **Include specific details** about what happened
- **Attach screenshots** or additional context
- **Document workarounds** if applicable

#### Completing the Test

- Test **completes automatically** after the last step
- **Review final results** summary
- **Results are automatically saved** to the file system
- **Dashboard statistics** are updated in real-time

### Test Results

Each test execution creates a result record containing:
- **Execution timestamp**
- **Overall status** (Pass/Fail/Blocked/Skipped)
- **Step-by-step results**
- **Duration information**
- **Tester notes**
- **System metadata**

## 📋 Test Plans

### Creating Test Plans

1. **Navigate** to "Test Plans"
2. **Click "New Test Plan"**
3. **Enter plan details**:
   - **Name**: Plan identifier
   - **Description**: Purpose and scope
   - **Target Date**: Planned completion date
4. **Add test cases** to the plan
5. **Save the test plan**

### Managing Test Plans

#### Viewing Plans
- **List all plans** with status and progress
- **Filter by status** (Active, Completed, Archived)
- **Search by name** or description

#### Editing Plans
- **Modify plan details**
- **Add or remove test cases**
- **Update target dates**
- **Change plan status**

#### Executing Plans
- **Run all test cases** in the plan
- **Track execution progress**
- **View plan-level statistics**
- **Generate plan reports**

## 📊 Dashboard Analytics

### Real-time Statistics

The dashboard provides live insights:

#### Test Case Metrics
- **Total test cases** created
- **Test cases by priority** breakdown
- **Recently modified** test cases
- **Test case creation** trends

#### Execution Statistics
- **Total test runs** completed
- **Pass/fail rates** and trends
- **Average execution time**
- **Test frequency** patterns

#### Recent Activity Feed
- **Latest test executions**
- **Recent test case modifications**
- **System activity** and changes
- **User activity** tracking

### Understanding Metrics

#### Pass Rate Calculation
```
Pass Rate = (Passed Tests / Total Executed Tests) × 100
```

#### Activity Categories
- **test_execution**: Individual test runs
- **batch_execution**: Batch test runs
- **test_case_created**: New test case creation
- **test_case_modified**: Test case updates

### Using Analytics

- **Monitor testing progress** over time
- **Identify problematic tests** with low pass rates
- **Track team productivity** and activity
- **Plan testing efforts** based on trends

## 🔗 GitHub Integration

### Authentication Setup

GitHub integration requires:
1. **GitHub OAuth app** configured
2. **User authentication** via GitHub
3. **Repository access** permissions

### Repository Management

#### Selecting Repositories
1. **Go to "GitHub Issues"**
2. **Choose from accessible repositories**
3. **Browse available issues**

#### Issue Integration
- **View issue details** within the application
- **Generate test cases** from issue descriptions
- **Link test cases** back to original issues
- **Track issue-to-test** relationships

### AI Test Case Generation

#### From GitHub Issues

1. **Select an issue** from the repository browser
2. **Click "Generate Test Cases"**
3. **AI analyzes** issue content and creates relevant test cases
4. **Review and customize** generated test cases
5. **Save or modify** as needed

#### AI Generation Process
- **Analyzes issue title** and description
- **Identifies testable scenarios**
- **Creates logical test steps**
- **Suggests appropriate priorities**
- **Maintains traceability** to original issue

#### Customization
- **Edit generated steps**
- **Adjust priorities** and preconditions
- **Add additional test cases**
- **Combine or split** generated tests

## 🔄 Batch Operations

### Batch Test Execution

#### Selecting Test Cases
1. **Go to Test Cases** page
2. **Use checkboxes** to select multiple test cases
3. **Click "Run Selected"** button
4. **Review selection** and click "Start Batch Execution"

#### Execution Process
- **Tests run sequentially** one at a time
- **Complete each step** as in individual execution
- **Progress tracked** with real-time statistics
- **Can pause/resume** batch execution
- **Skip individual tests** if needed

#### Monitoring Progress
- **Overall progress bar** shows completion percentage
- **Current test** and step indicators
- **Real-time statistics** (pass/fail counts)
- **Time estimates** and duration tracking

#### Results Management
- **Automatic result saving** after each test
- **Comprehensive batch report** generation
- **CSV export** with detailed statistics
- **Dashboard integration** for analytics

### Batch Result Analysis

The batch execution provides:
- **Individual test results**
- **Step-by-step outcomes**
- **Timing information**
- **Aggregate statistics**
- **Failure analysis**

## 📤 Export and Reporting

### CSV Export Options

#### Individual Test Results
- **Available after each test execution**
- **Includes step-by-step results**
- **Timing and duration data**
- **Tester notes and comments**

#### Batch Results
- **Comprehensive batch execution data**
- **All test cases and steps**
- **Aggregate statistics**
- **Execution timeline**

#### Custom Reports
- **Select specific test cases**
- **Choose date ranges**
- **Filter by result types**
- **Include or exclude specific data**

### Report Contents

Standard reports include:
- **Test case metadata** (ID, title, priority)
- **Execution results** (pass/fail/blocked/skipped)
- **Step-by-step outcomes**
- **Timing information** (start, end, duration)
- **Notes and observations**
- **Tester information**

### Using Exported Data

Exported CSV files can be used for:
- **Further analysis** in spreadsheet applications
- **Integration** with other tools
- **Stakeholder reporting**
- **Historical tracking**
- **Compliance documentation**

## ⚙️ Settings and Customization

### Theme Management

#### Switching Themes
1. **Click the theme toggle** in the navigation
2. **Choose from options**:
   - **Light**: Light theme for daytime use
   - **Dark**: Dark theme for low-light environments
   - **System**: Follows system preference

#### Theme Features
- **Automatic persistence** across sessions
- **Proper contrast ratios** for accessibility
- **Semantic color system** for consistency
- **Professional appearance** for business use

### File Organization

QA Test Manager uses structured file storage:

```
project-root/
├── testcases/           # Test case storage
│   ├── tc-001.md       # Individual test case files
│   └── tc-002.md
├── testplans/          # Test plan storage  
│   ├── tp-001.json     # Test plan definitions
│   └── tp-002.json
└── results/            # Test result storage
    ├── result-001.json # Execution results
    └── result-002.json
```

#### Benefits of File-Based Storage
- **Version control** with Git
- **Human-readable** formats
- **Easy backup** and migration
- **No database** dependencies
- **Portable** across environments

### Customization Options

#### Environment Variables
Configure application behavior via environment variables:
- **Application name** and branding
- **Default settings** and preferences
- **Integration endpoints**
- **Feature toggles**

#### File System Configuration
- **Storage directories** can be customized
- **File naming** conventions
- **Backup strategies**
- **Permission settings**

## 🔍 Search and Filtering

### Test Case Search

#### Search Options
- **Text search**: Search in titles, descriptions, and step content
- **Priority filter**: Filter by Critical, High, Medium, Low
- **Tag filter**: Filter by assigned tags
- **Status filter**: Filter by execution status

#### Advanced Filtering
- **Date range**: Filter by creation or modification date
- **Execution status**: Show only passed, failed, or unexecuted tests
- **GitHub integration**: Filter by linked issues
- **Combined filters**: Use multiple filters simultaneously

### Search Tips

- **Use quotes** for exact phrase matching
- **Combine keywords** with spaces for AND search
- **Use tags** for category-based filtering
- **Save frequent** filter combinations

## 💡 Best Practices

### Test Case Design

#### Writing Effective Test Cases
1. **Clear titles** - Use descriptive, action-oriented titles
2. **Detailed steps** - Write specific, actionable instructions
3. **Expected results** - Define clear success criteria
4. **Logical order** - Organize steps in logical sequence
5. **Appropriate granularity** - Not too broad, not too narrow

#### Test Step Guidelines
- **One action per step** - Keep steps focused
- **Clear language** - Use simple, unambiguous terms
- **Testable assertions** - Make expected results verifiable
- **Consider edge cases** - Include boundary conditions

### Test Execution

#### Consistency Tips
1. **Use standardized environments** for testing
2. **Document detailed notes** for issues and observations
3. **Execute tests regularly** for consistent coverage
4. **Review results** for patterns and trends

#### Collaboration
1. **Establish team conventions** for test writing
2. **Regular review cycles** for test case updates
3. **Knowledge sharing** of domain-specific testing
4. **Version control** for collaborative management

### Workflow Optimization

#### Efficient Testing
- **Batch similar tests** for efficiency
- **Use test plans** for organized execution
- **Regular maintenance** of test case library
- **Automated reporting** for stakeholders

#### Quality Assurance
- **Peer review** of new test cases
- **Regular cleanup** of obsolete tests
- **Documentation updates** as features evolve
- **Metrics tracking** for improvement

---

**Congratulations!** You now have comprehensive knowledge of QA Test Manager. Start creating test cases and improve your testing workflows! 🎉