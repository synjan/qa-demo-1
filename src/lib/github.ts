import { Octokit } from '@octokit/rest'
import { GitHubIssue, GitHubRepository } from './types'
import { GitHubCacheManager } from './cache'

export class GitHubService {
  private octokit: Octokit
  private token: string

  constructor(token: string) {
    this.token = token
    this.octokit = new Octokit({
      auth: token
    })
  }

  async getUser() {
    const { data } = await this.octokit.rest.users.getAuthenticated()
    return data
  }

  async getRepositories(): Promise<GitHubRepository[]> {
    // Check cache first if enabled
    if (GitHubCacheManager.isCacheEnabled()) {
      const cached = await GitHubCacheManager.getCachedRepositories<GitHubRepository[]>(this.token)
      if (cached) {
        console.log('Cache HIT: repositories')
        return cached
      }
      console.log('Cache MISS: repositories')
    }

    const { data, headers } = await this.octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100
    })
    
    const repositories = data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url
      },
      description: repo.description,
      html_url: repo.html_url,
      updated_at: repo.updated_at,
      stargazers_count: repo.stargazers_count || 0,
      forks_count: repo.forks_count || 0,
      open_issues_count: repo.open_issues_count || 0,
      has_issues: repo.has_issues
    }))

    // Cache the result if enabled
    if (GitHubCacheManager.isCacheEnabled()) {
      await GitHubCacheManager.setCachedRepositories(
        this.token, 
        repositories, 
        headers.etag
      )
    }

    return repositories
  }

  async getIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
    // Check cache first if enabled
    if (GitHubCacheManager.isCacheEnabled()) {
      const cached = await GitHubCacheManager.getCachedIssues<GitHubIssue[]>(
        owner, 
        repo, 
        state, 
        this.token
      )
      if (cached) {
        console.log(`Cache HIT: issues ${owner}/${repo} (${state})`)
        return cached
      }
      console.log(`Cache MISS: issues ${owner}/${repo} (${state})`)
    }

    const { data, headers } = await this.octokit.rest.issues.listForRepo({
      owner,
      repo,
      state,
      per_page: 100
    })

    const issues = data.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state as 'open' | 'closed',
      labels: issue.labels.map(label => ({
        id: typeof label === 'object' && label !== null && 'id' in label ? (label as any).id : 0,
        name: typeof label === 'string' ? label : (label as any).name || '',
        color: typeof label === 'object' && label !== null && 'color' in label ? (label as any).color : '',
        description: typeof label === 'object' && label !== null && 'description' in label ? (label as any).description : null
      })),
      user: {
        login: issue.user?.login || '',
        avatar_url: issue.user?.avatar_url || ''
      },
      assignee: issue.assignee ? {
        login: issue.assignee.login,
        avatar_url: issue.assignee.avatar_url
      } : null,
      comments: issue.comments || 0,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      html_url: issue.html_url
    }))

    // Cache the result if enabled
    if (GitHubCacheManager.isCacheEnabled()) {
      await GitHubCacheManager.setCachedIssues(
        owner, 
        repo, 
        state, 
        this.token, 
        issues, 
        headers.etag
      )
    }

    return issues
  }

  async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    const { data } = await this.octokit.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber
    })

    return {
      id: data.id,
      number: data.number,
      title: data.title,
      body: data.body,
      state: data.state as 'open' | 'closed',
      labels: data.labels.map(label => ({
        id: typeof label === 'object' && label !== null && 'id' in label ? (label as any).id : 0,
        name: typeof label === 'string' ? label : (label as any).name || '',
        color: typeof label === 'object' && label !== null && 'color' in label ? (label as any).color : '',
        description: typeof label === 'object' && label !== null && 'description' in label ? (label as any).description : null
      })),
      user: {
        login: data.user?.login || '',
        avatar_url: data.user?.avatar_url || ''
      },
      assignee: data.assignee ? {
        login: data.assignee.login,
        avatar_url: data.assignee.avatar_url
      } : null,
      comments: data.comments || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      html_url: data.html_url
    }
  }

  static createFromToken(token: string): GitHubService {
    return new GitHubService(token)
  }

  static createFromPAT(): GitHubService | null {
    if (typeof window === 'undefined') return null
    
    const pat = localStorage.getItem('github_pat')
    if (!pat) return null
    
    return new GitHubService(pat)
  }
}