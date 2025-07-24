import { Octokit } from '@octokit/rest'
import { GitHubService } from '../github'
import { GitHubCacheManager } from '../cache'
import { GitHubFactory } from '@/test-utils/factories'

// Mock Octokit
jest.mock('@octokit/rest')
// Mock cache manager
jest.mock('../cache')

describe('GitHubService', () => {
  let service: GitHubService
  let mockOctokit: jest.Mocked<Octokit>

  beforeEach(() => {
    jest.clearAllMocks()
    GitHubFactory.reset()
    
    // Mock cache manager methods
    ;(GitHubCacheManager.isCacheEnabled as jest.Mock).mockReturnValue(false)
    ;(GitHubCacheManager.getCachedRepositories as jest.Mock).mockResolvedValue(null)
    ;(GitHubCacheManager.setCachedRepositories as jest.Mock).mockResolvedValue(undefined)
    ;(GitHubCacheManager.getCachedIssues as jest.Mock).mockResolvedValue(null)
    ;(GitHubCacheManager.setCachedIssues as jest.Mock).mockResolvedValue(undefined)
    
    // Create mock Octokit instance using factory
    mockOctokit = GitHubFactory.mockOctokit() as any

    // Mock constructor
    ;(Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => mockOctokit)
    
    service = new GitHubService('test-token')
  })

  describe('getRepositories', () => {
    it('should fetch repositories successfully', async () => {
      const mockRepos = GitHubFactory.repositories(2)
      
      // Override the mock to return our test data
      mockOctokit.rest.repos.listForAuthenticatedUser.mockResolvedValue({
        data: mockRepos,
        headers: { etag: 'test-etag' }
      } as any)

      const repos = await service.getRepositories()

      expect(repos).toHaveLength(2)
      expect(repos[0]).toMatchObject({
        id: mockRepos[0].id,
        name: mockRepos[0].name,
        full_name: mockRepos[0].full_name
      })
      expect(repos[1]).toMatchObject({
        id: mockRepos[1].id,
        name: mockRepos[1].name,
        full_name: mockRepos[1].full_name
      })
      expect(mockOctokit.rest.repos.listForAuthenticatedUser).toHaveBeenCalledWith({
        per_page: 100,
        sort: 'updated',
      })
    })

    it('should handle errors when fetching repositories', async () => {
      const error = GitHubFactory.createGitHubError(500, 'Internal Server Error')
      mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(error)

      await expect(service.getRepositories()).rejects.toThrow('Internal Server Error')
    })

    it('should use default pagination', async () => {
      mockOctokit.rest.repos.listForAuthenticatedUser.mockResolvedValue({
        data: [],
        headers: { etag: 'test-etag' }
      } as any)

      await service.getRepositories()

      expect(mockOctokit.rest.repos.listForAuthenticatedUser).toHaveBeenCalledWith({
        per_page: 100,
        sort: 'updated',
      })
    })
  })

  describe('getRepository', () => {
    it('should fetch a single repository', async () => {
      const mockRepo = GitHubFactory.repository({
        owner: { login: 'owner' },
        name: 'test-repo',
        full_name: 'owner/test-repo',
      })

      mockOctokit.rest.repos.get.mockResolvedValue({
        data: mockRepo,
      } as any)

      const repo = await service.getRepository('owner', 'test-repo')

      expect(repo).toEqual(mockRepo)
      expect(mockOctokit.rest.repos.get).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'test-repo',
      })
    })

    it('should handle repository not found', async () => {
      const error = GitHubFactory.createGitHubError(404, 'Not Found')
      mockOctokit.rest.repos.get.mockRejectedValue(error)

      await expect(service.getRepository('owner', 'nonexistent')).rejects.toMatchObject({
        status: 404,
      })
    })
  })

  describe('getIssues', () => {
    it('should fetch issues for a repository', async () => {
      const mockIssues = [
        GitHubFactory.issue({ state: 'open', labels: [] }),
        GitHubFactory.issue({ 
          state: 'closed',
          labels: [{ id: 1, name: 'bug', color: 'ff0000', description: 'Something isn\'t working' }],
          assignee: { login: 'user1', avatar_url: 'https://example.com/u1.png' },
          comments: 2
        }),
      ]

      mockOctokit.rest.issues.listForRepo.mockResolvedValue({
        data: mockIssues,
        headers: { etag: 'test-etag' }
      } as any)

      const issues = await service.getIssues('owner', 'repo')

      expect(issues).toHaveLength(2)
      expect(issues[0]).toMatchObject({
        id: mockIssues[0].id,
        number: mockIssues[0].number,
        title: mockIssues[0].title,
        state: 'open'
      })
      expect(issues[1]).toMatchObject({
        id: mockIssues[1].id,
        number: mockIssues[1].number,
        title: mockIssues[1].title,
        state: 'closed'
      })
      expect(mockOctokit.rest.issues.listForRepo).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        state: 'open',
        per_page: 100,
      })
    })

    it('should filter issues by state', async () => {
      mockOctokit.rest.issues.listForRepo.mockResolvedValue({
        data: [],
      } as any)

      await service.getIssues('owner', 'repo', 'closed')

      expect(mockOctokit.rest.issues.listForRepo).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        state: 'closed',
        per_page: 100,
      })
    })

    it('should use all state when specified', async () => {
      mockOctokit.rest.issues.listForRepo.mockResolvedValue({
        data: [],
      } as any)

      await service.getIssues('owner', 'repo', 'all')

      expect(mockOctokit.rest.issues.listForRepo).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        state: 'all',
        per_page: 100,
      })
    })
  })

  describe('getIssue', () => {
    it('should fetch a single issue', async () => {
      const mockIssue = GitHubFactory.issue({ number: 1 })

      mockOctokit.rest.issues.get.mockResolvedValue({
        data: mockIssue,
      } as any)

      const issue = await service.getIssue('owner', 'repo', 1)

      expect(issue).toEqual(mockIssue)
      expect(mockOctokit.rest.issues.get).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: 1,
      })
    })
  })

  describe('getUser', () => {
    it('should fetch authenticated user', async () => {
      const mockUser = {
        login: 'testuser',
        id: 123,
        name: 'Test User',
        email: 'test@example.com',
      }

      mockOctokit.rest.users.getAuthenticated.mockResolvedValue({
        data: mockUser,
      } as any)

      const user = await service.getUser()

      expect(user).toEqual(mockUser)
      expect(mockOctokit.rest.users.getAuthenticated).toHaveBeenCalled()
    })

    it('should handle authentication errors', async () => {
      const error = GitHubFactory.createGitHubError(401, 'Unauthorized')
      mockOctokit.rest.users.getAuthenticated.mockRejectedValue(error)

      await expect(service.getUser()).rejects.toMatchObject({
        status: 401,
      })
    })
  })

  describe('constructor', () => {
    it('should create Octokit instance with provided token', () => {
      const token = 'ghp_test123'
      new GitHubService(token)

      expect(Octokit).toHaveBeenCalledWith({
        auth: token,
      })
    })
  })

  describe('error handling', () => {
    it('should handle rate limit errors', async () => {
      const error = GitHubFactory.createGitHubError(403, 'API rate limit exceeded')
      error.response.headers = {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': '1234567890',
      }
      mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(error)

      await expect(service.getRepositories()).rejects.toMatchObject({
        status: 403,
      })
    })

    it('should handle network errors', async () => {
      mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(
        new Error('Network error')
      )

      await expect(service.getRepositories()).rejects.toThrow('Network error')
    })
  })
})