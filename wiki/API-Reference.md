# API Reference

Complete reference for QA Test Manager's REST API endpoints.

## 🔐 Authentication

QA Test Manager uses NextAuth.js for session-based authentication. All API requests require valid authentication.

### Authentication Methods

#### Session Authentication (Primary)
```http
Cookie: next-auth.session-token=<session-token>
```

#### API Key Authentication (Future)
```http
Authorization: Bearer <api-key>
```

### Authentication Flow
1. User authenticates via GitHub OAuth
2. NextAuth creates secure session
3. Session token included in requests automatically
4. API validates session for each request

## 📋 Test Cases API

### GET /api/testcases

Retrieve all test cases with optional filtering.

**Query Parameters:**
- `priority` (optional): Filter by priority (`critical`, `high`, `medium`, `low`)
- `status` (optional): Filter by execution status
- `search` (optional): Search in title and description
- `tags` (optional): Filter by tags (comma-separated)
- `page` (optional): Page number for pagination
- `limit` (optional): Number of results per page (default: 50)

**Request:**
```http
GET /api/testcases?priority=high&search=login&page=1&limit=20
```

**Response:**
```json
{
  "testCases": [
    {
      "id": "tc-001",
      "title": "User Login Test",
      "description": "Verify user can log in with valid credentials",
      "priority": "high",
      "preconditions": "User account exists in system",
      "steps": [
        {
          "action": "Navigate to login page",
          "expectedResult": "Login form is displayed"
        },
        {
          "action": "Enter valid username and password",
          "expectedResult": "User is redirected to dashboard"
        }
      ],
      "tags": ["authentication", "login", "smoke"],
      "githubIssue": "https://github.com/owner/repo/issues/123",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### GET /api/testcases/[id]

Retrieve a specific test case by ID.

**Parameters:**
- `id`: Test case identifier

**Response:**
```json
{
  "id": "tc-001",
  "title": "User Login Test",
  "description": "Verify user can log in with valid credentials",
  "priority": "high",
  "preconditions": "User account exists in system",
  "steps": [
    {
      "action": "Navigate to login page",
      "expectedResult": "Login form is displayed"
    }
  ],
  "tags": ["authentication", "login"],
  "githubIssue": "https://github.com/owner/repo/issues/123",
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-15T10:30:00Z",
  "executionHistory": [
    {
      "id": "exec-001",
      "executedAt": "2023-01-10T14:30:00Z",
      "status": "pass",
      "duration": 120000
    }
  ]
}
```

### POST /api/testcases

Create a new test case.

**Request Body:**
```json
{
  "title": "Password Reset Test",
  "description": "Verify password reset functionality works correctly",
  "priority": "medium",
  "preconditions": "User account exists with valid email",
  "steps": [
    {
      "action": "Click 'Forgot Password' link",
      "expectedResult": "Password reset form is displayed"
    },
    {
      "action": "Enter valid email address",
      "expectedResult": "Reset email is sent"
    }
  ],
  "tags": ["authentication", "password", "email"],
  "githubIssue": "https://github.com/owner/repo/issues/124"
}
```

**Response:**
```json
{
  "id": "tc-002",
  "message": "Test case created successfully",
  "testCase": {
    "id": "tc-002",
    "title": "Password Reset Test",
    "createdAt": "2023-01-16T09:15:00Z"
  }
}
```

### PUT /api/testcases/[id]

Update an existing test case.

**Parameters:**
- `id`: Test case identifier

**Request Body:** Same structure as POST, all fields optional

**Response:**
```json
{
  "id": "tc-001",
  "message": "Test case updated successfully",
  "changes": ["title", "steps", "tags"]
}
```

### DELETE /api/testcases/[id]

Delete a test case.

**Parameters:**
- `id`: Test case identifier

**Response:**
```json
{
  "message": "Test case deleted successfully",
  "id": "tc-001"
}
```

## 📋 Test Plans API

### GET /api/testplans

Retrieve all test plans.

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `completed`, `archived`)
- `search` (optional): Search in name and description

**Response:**
```json
{
  "testPlans": [
    {
      "id": "tp-001",
      "name": "User Authentication Test Plan",
      "description": "Complete testing of authentication features",
      "testCases": ["tc-001", "tc-002", "tc-003"],
      "targetDate": "2023-12-31",
      "status": "active",
      "progress": {
        "total": 3,
        "completed": 2,
        "passed": 2,
        "failed": 0
      },
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-15T10:30:00Z"
    }
  ]
}
```

### GET /api/testplans/[id]

Retrieve a specific test plan by ID.

### POST /api/testplans

Create a new test plan.

**Request Body:**
```json
{
  "name": "Feature X Test Plan",
  "description": "Comprehensive testing for new feature X",
  "testCases": ["tc-004", "tc-005", "tc-006"],
  "targetDate": "2023-06-30"
}
```

### PUT /api/testplans/[id]

Update an existing test plan.

### DELETE /api/testplans/[id]

Delete a test plan.

## 🏃‍♂️ Test Results API

### GET /api/testresults

Retrieve test execution results.

**Query Parameters:**
- `testCaseId` (optional): Filter by test case ID
- `status` (optional): Filter by result status (`pass`, `fail`, `blocked`, `skipped`)
- `dateFrom` (optional): Filter results from date (ISO 8601)
- `dateTo` (optional): Filter results to date (ISO 8601)
- `executedBy` (optional): Filter by executor

**Response:**
```json
{
  "results": [
    {
      "id": "tr-001",
      "testCaseId": "tc-001",
      "executionDate": "2023-01-10T14:30:00Z",
      "status": "pass",
      "duration": 120000,
      "stepResults": [
        {
          "stepIndex": 0,
          "status": "pass",
          "notes": "Login form loaded correctly",
          "timestamp": "2023-01-10T14:30:30Z"
        },
        {
          "stepIndex": 1,
          "status": "pass",
          "notes": "Successfully logged in",
          "timestamp": "2023-01-10T14:31:45Z"
        }
      ],
      "notes": "Test executed successfully without issues",
      "executedBy": "user@example.com",
      "environment": "staging"
    }
  ]
}
```

### GET /api/testresults/[id]

Retrieve a specific test result by ID.

### POST /api/testresults

Record a new test execution result.

**Request Body:**
```json
{
  "testCaseId": "tc-001",
  "status": "pass",
  "stepResults": [
    {
      "stepIndex": 0,
      "status": "pass",
      "notes": "Step completed successfully"
    },
    {
      "stepIndex": 1,
      "status": "fail",
      "notes": "Unexpected error occurred"
    }
  ],
  "notes": "Overall test completed with one failure",
  "environment": "production"
}
```

**Response:**
```json
{
  "id": "tr-002",
  "message": "Test result recorded successfully"
}
```

### POST /api/testruns

Record a batch test execution (internal API).

**Request Body:**
```json
{
  "id": "batch-001",
  "type": "batch_run",
  "title": "Batch Run - Authentication Tests",
  "description": "Batch execution of authentication test cases",
  "testCases": ["tc-001", "tc-002", "tc-003"],
  "executionState": {
    "status": "completed",
    "results": [...]
  },
  "stats": {
    "passed": 2,
    "failed": 1,
    "blocked": 0,
    "skipped": 0
  },
  "duration": 300000
}
```

## 📊 Dashboard API

### GET /api/dashboard/stats

Retrieve dashboard statistics.

**Response:**
```json
{
  "testCases": {
    "total": 150,
    "byPriority": {
      "critical": 25,
      "high": 45,
      "medium": 60,
      "low": 20
    },
    "recentlyCreated": 8,
    "recentlyModified": 12
  },
  "testPlans": {
    "total": 12,
    "active": 8,
    "completed": 4,
    "averageProgress": 67.5
  },
  "testRuns": {
    "total": 450,
    "thisWeek": 45,
    "thisMonth": 180,
    "passRate": 87.5,
    "averageDuration": 145000
  },
  "activity": {
    "testsExecutedToday": 12,
    "testCasesCreatedThisWeek": 8,
    "activeUsers": 5
  }
}
```

### GET /api/dashboard/activity

Retrieve recent activity feed.

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 10, max: 50)
- `type` (optional): Filter by activity type
- `dateFrom` (optional): Activities from date
- `dateTo` (optional): Activities to date

**Response:**
```json
{
  "activities": [
    {
      "id": "activity-001",
      "type": "test_execution",
      "title": "Executed test case: User Login Test",
      "description": "Test case tc-001 executed with status: pass",
      "timestamp": "2023-01-10T14:30:00Z",
      "status": "pass",
      "user": "user@example.com",
      "metadata": {
        "testCaseId": "tc-001",
        "duration": 120000
      }
    },
    {
      "id": "activity-002",
      "type": "test_case_created",
      "title": "Created test case: Password Reset Test",
      "description": "New test case tc-002 created",
      "timestamp": "2023-01-10T09:15:00Z",
      "user": "user@example.com",
      "metadata": {
        "testCaseId": "tc-002",
        "priority": "medium"
      }
    }
  ]
}
```

## 🔗 GitHub Integration API

### GET /api/github/user

Get authenticated GitHub user information.

**Response:**
```json
{
  "login": "username",
  "name": "User Name",
  "email": "user@example.com",
  "avatar_url": "https://github.com/avatar.jpg",
  "public_repos": 25,
  "created_at": "2020-01-01T00:00:00Z"
}
```

### GET /api/github/repos

Get user's accessible repositories.

**Query Parameters:**
- `type` (optional): Repository type (`all`, `owner`, `member`) (default: `all`)
- `sort` (optional): Sort order (`created`, `updated`, `pushed`, `full_name`) (default: `updated`)
- `per_page` (optional): Results per page (default: 30, max: 100)

**Response:**
```json
{
  "repositories": [
    {
      "id": 123456,
      "name": "my-project",
      "full_name": "username/my-project",
      "description": "My awesome project",
      "private": false,
      "html_url": "https://github.com/username/my-project",
      "language": "JavaScript",
      "updated_at": "2023-01-15T10:30:00Z",
      "open_issues_count": 5
    }
  ]
}
```

### GET /api/github/repos/[owner]/[repo]/issues

Get issues from a specific repository.

**Parameters:**
- `owner`: Repository owner
- `repo`: Repository name

**Query Parameters:**
- `state` (optional): Issue state (`open`, `closed`, `all`) (default: `open`)
- `labels` (optional): Filter by labels (comma-separated)
- `sort` (optional): Sort order (`created`, `updated`, `comments`) (default: `created`)
- `direction` (optional): Sort direction (`asc`, `desc`) (default: `desc`)
- `per_page` (optional): Results per page (default: 30, max: 100)

**Response:**
```json
{
  "issues": [
    {
      "id": 789,
      "number": 123,
      "title": "Bug: Login form validation",
      "body": "The login form doesn't validate email addresses properly...",
      "state": "open",
      "labels": [
        {
          "name": "bug",
          "color": "d73a4a",
          "description": "Something isn't working"
        },
        {
          "name": "priority: high",
          "color": "ff6b6b",
          "description": "High priority issue"
        }
      ],
      "assignees": [
        {
          "login": "developer1",
          "avatar_url": "https://github.com/avatar1.jpg"
        }
      ],
      "html_url": "https://github.com/username/my-project/issues/123",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/github/generate-testcases

Generate test cases from GitHub issue using AI.

**Request Body:**
```json
{
  "issueUrl": "https://github.com/username/repo/issues/123",
  "issueTitle": "Bug: Login form validation",
  "issueBody": "The login form doesn't validate email addresses properly when users enter invalid formats. This causes confusion and poor user experience.",
  "priority": "high",
  "labels": ["bug", "frontend", "validation"]
}
```

**Response:**
```json
{
  "success": true,
  "testCases": [
    {
      "title": "Test email validation on login form",
      "description": "Verify that the login form properly validates email addresses and shows appropriate error messages",
      "priority": "high",
      "preconditions": "Login form is accessible and user has test account",
      "steps": [
        {
          "action": "Navigate to login page",
          "expectedResult": "Login form is displayed with email and password fields"
        },
        {
          "action": "Enter invalid email format (e.g., 'invalid-email')",
          "expectedResult": "Email validation error message is displayed"
        },
        {
          "action": "Enter valid email format but non-existent account",
          "expectedResult": "Appropriate error message for non-existent account"
        }
      ],
      "tags": ["validation", "email", "login", "frontend"],
      "githubIssue": "https://github.com/username/repo/issues/123"
    }
  ],
  "metadata": {
    "generatedAt": "2023-01-16T11:45:00Z",
    "model": "gpt-4",
    "processingTime": 2.5
  }
}
```

## 📁 File Management API

### GET /api/files/export

Export test data in various formats.

**Query Parameters:**
- `type`: Export type (`testcases`, `testplans`, `results`, `all`)
- `format`: Export format (`json`, `csv`, `markdown`)
- `filter` (optional): Filter criteria (JSON string)
- `dateFrom` (optional): Export data from date
- `dateTo` (optional): Export data to date

**Response:**
```json
{
  "downloadUrl": "/api/files/download/export-123456.csv",
  "filename": "testcases-export-2023-01-16.csv",
  "size": 15420,
  "recordCount": 150,
  "generatedAt": "2023-01-16T12:00:00Z"
}
```

### GET /api/files/download/[filename]

Download exported file.

**Parameters:**
- `filename`: Generated filename from export API

**Response:** File download with appropriate MIME type

## 🔧 Utility APIs

### GET /api/health

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-01-16T12:00:00Z",
  "version": "0.1.0",
  "uptime": 86400,
  "checks": {
    "fileSystem": "healthy",
    "github": "healthy",
    "openai": "healthy"
  }
}
```

### GET /api/version

Get application version information.

**Response:**
```json
{
  "version": "0.1.0",
  "buildDate": "2023-01-15T09:00:00Z",
  "gitCommit": "abc123def456",
  "environment": "production"
}
```

## ❌ Error Handling

### Error Response Format

All API endpoints return consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid test case data provided",
    "details": "The 'title' field is required and cannot be empty",
    "field": "title"
  },
  "timestamp": "2023-01-16T12:00:00Z",
  "path": "/api/testcases",
  "method": "POST"
}
```

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_REQUIRED` | User not authenticated |
| `PERMISSION_DENIED` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `EXTERNAL_SERVICE_ERROR` | GitHub/OpenAI service error |
| `FILE_SYSTEM_ERROR` | File operation failed |

## 🚦 Rate Limiting

API requests are rate-limited to ensure service availability:

### Rate Limit Rules

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| General API | 100 requests | 1 minute |
| File Operations | 50 requests | 1 minute |
| AI Generation | 10 requests | 1 minute |
| GitHub API | 60 requests | 1 hour |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-RetryAfter: 60
```

## 🔮 Future API Features

### Planned Enhancements

- **WebSocket Support**: Real-time updates and notifications
- **Webhook Support**: External system integrations
- **GraphQL API**: Flexible data querying
- **API Versioning**: Backward compatibility support
- **Bulk Operations**: Efficient batch processing
- **Advanced Filtering**: Complex query capabilities

### SDK Support

Official client libraries planned for:
- **JavaScript/TypeScript**: npm package
- **Python**: PyPI package
- **cURL**: Command-line examples

---

For the complete OpenAPI specification, visit `/api/openapi.json` when the application is running. 📖