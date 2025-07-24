import { GitHubRepository, GitHubIssue } from '@/lib/types';

let repositoryIdCounter = 1;
let issueIdCounter = 1;

export class GitHubFactory {
  static reset() {
    repositoryIdCounter = 1;
    issueIdCounter = 1;
  }

  static repository(overrides: Partial<GitHubRepository> = {}): GitHubRepository {
    const id = repositoryIdCounter++;
    const owner = overrides.owner?.login || 'testuser';
    const name = overrides.name || `test-repo-${id}`;
    
    return {
      id,
      name,
      full_name: `${owner}/${name}`,
      private: false,
      owner: {
        login: owner,
        avatar_url: `https://avatars.githubusercontent.com/u/${id}`,
        ...overrides.owner,
      },
      description: `Test repository ${id}`,
      html_url: `https://github.com/${owner}/${name}`,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      pushed_at: new Date().toISOString(),
      size: Math.floor(Math.random() * 10000),
      stargazers_count: Math.floor(Math.random() * 100),
      watchers_count: Math.floor(Math.random() * 50),
      forks_count: Math.floor(Math.random() * 20),
      open_issues_count: Math.floor(Math.random() * 10),
      default_branch: 'main',
      has_issues: true,
      has_projects: true,
      has_wiki: true,
      has_pages: false,
      has_downloads: true,
      language: 'TypeScript',
      license: {
        key: 'mit',
        name: 'MIT License',
        spdx_id: 'MIT',
      },
      ...overrides,
    };
  }

  static repositories(count: number, overrides: Partial<GitHubRepository> = {}): GitHubRepository[] {
    return Array.from({ length: count }, () => this.repository(overrides));
  }

  static issue(overrides: Partial<GitHubIssue> = {}): GitHubIssue {
    const id = issueIdCounter++;
    const number = overrides.number || id;
    
    return {
      id,
      number,
      title: overrides.title || `Test Issue #${number}`,
      body: overrides.body || `This is test issue ${number} body content.`,
      state: 'open',
      labels: overrides.labels || [
        {
          id: 1,
          name: 'bug',
          color: 'd73a4a',
          description: 'Something isn\'t working',
        },
      ],
      user: {
        login: 'testuser',
        avatar_url: `https://avatars.githubusercontent.com/u/${id}`,
        ...overrides.user,
      },
      assignee: overrides.assignee || null,
      assignees: overrides.assignees || [],
      milestone: overrides.milestone || null,
      comments: overrides.comments || 0,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      closed_at: overrides.state === 'closed' ? new Date().toISOString() : null,
      html_url: `https://github.com/testuser/test-repo/issues/${number}`,
      repository_url: 'https://api.github.com/repos/testuser/test-repo',
      ...overrides,
    };
  }

  static issues(count: number, overrides: Partial<GitHubIssue> = {}): GitHubIssue[] {
    return Array.from({ length: count }, () => this.issue(overrides));
  }

  static mockOctokit(responses: {
    repositories?: GitHubRepository[];
    issues?: GitHubIssue[];
    repository?: GitHubRepository;
    user?: any;
    errors?: {
      repositories?: Error;
      issues?: Error;
      repository?: Error;
      user?: Error;
    };
  } = {}) {
    const mock = {
      rest: {
        repos: {
          listForAuthenticatedUser: jest.fn(),
          get: jest.fn(),
        },
        issues: {
          listForRepo: jest.fn(),
          get: jest.fn(),
        },
        users: {
          getAuthenticated: jest.fn(),
        },
      },
    };

    // Set up repository list mock
    if (responses.errors?.repositories) {
      mock.rest.repos.listForAuthenticatedUser.mockRejectedValue(responses.errors.repositories);
    } else {
      mock.rest.repos.listForAuthenticatedUser.mockResolvedValue({
        data: responses.repositories || this.repositories(3),
      });
    }

    // Set up single repository mock
    if (responses.errors?.repository) {
      mock.rest.repos.get.mockRejectedValue(responses.errors.repository);
    } else {
      mock.rest.repos.get.mockResolvedValue({
        data: responses.repository || this.repository(),
      });
    }

    // Set up issues mock
    if (responses.errors?.issues) {
      mock.rest.issues.listForRepo.mockRejectedValue(responses.errors.issues);
    } else {
      mock.rest.issues.listForRepo.mockResolvedValue({
        data: responses.issues || this.issues(5),
      });
    }

    // Set up user mock
    if (responses.errors?.user) {
      mock.rest.users.getAuthenticated.mockRejectedValue(responses.errors.user);
    } else {
      mock.rest.users.getAuthenticated.mockResolvedValue({
        data: responses.user || {
          login: 'testuser',
          id: 123,
          avatar_url: 'https://avatars.githubusercontent.com/u/123',
          name: 'Test User',
          email: 'test@example.com',
        },
      });
    }

    return mock;
  }

  static createGitHubError(status: number, message: string) {
    const error: any = new Error(message);
    error.status = status;
    error.response = {
      status,
      data: {
        message,
        documentation_url: 'https://docs.github.com/rest',
      },
    };
    return error;
  }
}