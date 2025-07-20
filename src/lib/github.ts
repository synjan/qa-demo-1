import { Octokit } from '@octokit/rest'
import { GitHubIssue, GitHubRepository } from './types'

export class GitHubService {
  private octokit: Octokit

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token
    })
  }

  async getUser() {
    const { data } = await this.octokit.rest.users.getAuthenticated()
    return data
  }

  async getRepositories(): Promise<GitHubRepository[]> {
    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100
    })
    
    return data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url
      },
      description: repo.description,
      html_url: repo.html_url
    }))
  }

  async getIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
    const { data } = await this.octokit.rest.issues.listForRepo({
      owner,
      repo,
      state,
      per_page: 100
    })

    return data.map(issue => ({
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
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      html_url: issue.html_url
    }))
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