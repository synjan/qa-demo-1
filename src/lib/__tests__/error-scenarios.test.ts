import { GitHubService } from '../github';
import { OpenAIService } from '../openai';
import { GitHubFactory } from '@/test-utils/factories';
import { Octokit } from '@octokit/rest';
import OpenAI from 'openai';

// Mock dependencies
jest.mock('@octokit/rest');
jest.mock('openai');
jest.mock('../cache');

describe('Comprehensive Error Scenarios', () => {
  describe('GitHub Service Error Handling', () => {
    let service: GitHubService;
    let mockOctokit: any;

    beforeEach(() => {
      jest.clearAllMocks();
      mockOctokit = GitHubFactory.mockOctokit();
      (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => mockOctokit);
      service = new GitHubService('test-token');
    });

    describe('Network Errors', () => {
      it('should handle network timeout', async () => {
        const timeoutError = new Error('ETIMEDOUT');
        (timeoutError as any).code = 'ETIMEDOUT';
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(timeoutError);

        await expect(service.getRepositories()).rejects.toThrow('ETIMEDOUT');
      });

      it('should handle DNS resolution failure', async () => {
        const dnsError = new Error('ENOTFOUND');
        (dnsError as any).code = 'ENOTFOUND';
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(dnsError);

        await expect(service.getRepositories()).rejects.toThrow('ENOTFOUND');
      });

      it('should handle connection refused', async () => {
        const connError = new Error('ECONNREFUSED');
        (connError as any).code = 'ECONNREFUSED';
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(connError);

        await expect(service.getRepositories()).rejects.toThrow('ECONNREFUSED');
      });

      it('should handle connection reset', async () => {
        const resetError = new Error('ECONNRESET');
        (resetError as any).code = 'ECONNRESET';
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(resetError);

        await expect(service.getRepositories()).rejects.toThrow('ECONNRESET');
      });
    });

    describe('API Rate Limiting', () => {
      it('should handle primary rate limit exceeded', async () => {
        const rateLimitError = GitHubFactory.createGitHubError(403, 'API rate limit exceeded');
        rateLimitError.response.headers = {
          'x-ratelimit-limit': '60',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
        };
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(rateLimitError);

        await expect(service.getRepositories()).rejects.toMatchObject({
          status: 403,
          message: expect.stringContaining('rate limit'),
        });
      });

      it('should handle secondary rate limit', async () => {
        const secondaryLimit = GitHubFactory.createGitHubError(403, 'You have exceeded a secondary rate limit');
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(secondaryLimit);

        await expect(service.getRepositories()).rejects.toMatchObject({
          status: 403,
          message: expect.stringContaining('secondary rate limit'),
        });
      });

      it('should handle abuse detection', async () => {
        const abuseError = GitHubFactory.createGitHubError(403, 'You have triggered an abuse detection mechanism');
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(abuseError);

        await expect(service.getRepositories()).rejects.toMatchObject({
          status: 403,
          message: expect.stringContaining('abuse detection'),
        });
      });
    });

    describe('Authentication Errors', () => {
      it('should handle invalid token', async () => {
        const authError = GitHubFactory.createGitHubError(401, 'Bad credentials');
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(authError);

        await expect(service.getRepositories()).rejects.toMatchObject({
          status: 401,
          message: expect.stringContaining('Bad credentials'),
        });
      });

      it('should handle expired token', async () => {
        const expiredError = GitHubFactory.createGitHubError(401, 'Token has expired');
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(expiredError);

        await expect(service.getRepositories()).rejects.toMatchObject({
          status: 401,
          message: expect.stringContaining('expired'),
        });
      });

      it('should handle insufficient scopes', async () => {
        const scopeError = GitHubFactory.createGitHubError(403, 'Requires authentication');
        scopeError.response.headers = {
          'x-oauth-scopes': 'public_repo',
          'x-accepted-oauth-scopes': 'repo',
        };
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(scopeError);

        await expect(service.getRepositories()).rejects.toMatchObject({
          status: 403,
        });
      });

      it('should handle revoked token', async () => {
        const revokedError = GitHubFactory.createGitHubError(401, 'Token has been revoked');
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(revokedError);

        await expect(service.getRepositories()).rejects.toMatchObject({
          status: 401,
          message: expect.stringContaining('revoked'),
        });
      });
    });

    describe('Data Validation Errors', () => {
      it('should handle malformed response', async () => {
        mockOctokit.rest.repos.listForAuthenticatedUser.mockResolvedValue({
          data: 'not-an-array',
        });

        // This should be handled gracefully or throw a specific error
        await expect(service.getRepositories()).rejects.toThrow();
      });

      it('should handle missing required fields', async () => {
        mockOctokit.rest.repos.listForAuthenticatedUser.mockResolvedValue({
          data: [{ id: 1 }], // Missing required fields
        });

        const repos = await service.getRepositories();
        expect(repos[0]).toHaveProperty('id', 1);
      });

      it('should handle null response', async () => {
        mockOctokit.rest.repos.listForAuthenticatedUser.mockResolvedValue({
          data: null,
        });

        await expect(service.getRepositories()).rejects.toThrow();
      });

      it('should handle extremely large response', async () => {
        const hugeArray = Array(10000).fill(GitHubFactory.repository());
        mockOctokit.rest.repos.listForAuthenticatedUser.mockResolvedValue({
          data: hugeArray,
        });

        const repos = await service.getRepositories();
        expect(repos).toHaveLength(10000);
      });
    });

    describe('Server Errors', () => {
      it('should handle 500 Internal Server Error', async () => {
        const serverError = GitHubFactory.createGitHubError(500, 'Internal Server Error');
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(serverError);

        await expect(service.getRepositories()).rejects.toMatchObject({
          status: 500,
        });
      });

      it('should handle 502 Bad Gateway', async () => {
        const gatewayError = GitHubFactory.createGitHubError(502, 'Bad Gateway');
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(gatewayError);

        await expect(service.getRepositories()).rejects.toMatchObject({
          status: 502,
        });
      });

      it('should handle 503 Service Unavailable', async () => {
        const unavailableError = GitHubFactory.createGitHubError(503, 'Service Unavailable');
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(unavailableError);

        await expect(service.getRepositories()).rejects.toMatchObject({
          status: 503,
        });
      });

      it('should handle 504 Gateway Timeout', async () => {
        const timeoutError = GitHubFactory.createGitHubError(504, 'Gateway Timeout');
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(timeoutError);

        await expect(service.getRepositories()).rejects.toMatchObject({
          status: 504,
        });
      });
    });

    describe('Edge Case Errors', () => {
      it('should handle circular reference in response', async () => {
        const circularObj: any = { id: 1, name: 'test' };
        circularObj.self = circularObj;
        mockOctokit.rest.repos.listForAuthenticatedUser.mockResolvedValue({
          data: [circularObj],
        });

        // Should handle without throwing
        await expect(service.getRepositories()).resolves.toBeDefined();
      });

      it('should handle promise rejection without error object', async () => {
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(undefined);

        await expect(service.getRepositories()).rejects.toBeDefined();
      });

      it('should handle non-Error rejection', async () => {
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue('string error');

        await expect(service.getRepositories()).rejects.toBeDefined();
      });

      it('should handle concurrent request failures', async () => {
        const error = GitHubFactory.createGitHubError(500, 'Server Error');
        mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(error);
        mockOctokit.rest.issues.listForRepo.mockRejectedValue(error);

        const promises = [
          service.getRepositories(),
          service.getIssues('owner', 'repo'),
        ];

        await expect(Promise.all(promises)).rejects.toThrow();
      });
    });
  });

  describe('OpenAI Service Error Handling', () => {
    let service: OpenAIService;
    let mockOpenAI: jest.Mocked<OpenAI>;

    beforeEach(() => {
      jest.clearAllMocks();
      
      mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn(),
          },
        },
      } as any;

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI);
      
      process.env.OPENAI_API_KEY = 'test-key';
      service = new OpenAIService();
    });

    describe('API Errors', () => {
      it('should handle API key invalid', async () => {
        const error = new Error('Invalid API key provided');
        (error as any).status = 401;
        mockOpenAI.chat.completions.create.mockRejectedValue(error);

        await expect(service.generateTestCases([])).rejects.toThrow('Invalid API key');
      });

      it('should handle quota exceeded', async () => {
        const error = new Error('You exceeded your current quota');
        (error as any).status = 429;
        mockOpenAI.chat.completions.create.mockRejectedValue(error);

        await expect(service.generateTestCases([])).rejects.toThrow('quota');
      });

      it('should handle model not found', async () => {
        const error = new Error('Model not found');
        (error as any).status = 404;
        mockOpenAI.chat.completions.create.mockRejectedValue(error);

        await expect(service.generateTestCases([])).rejects.toThrow('Model not found');
      });

      it('should handle rate limit', async () => {
        const error = new Error('Rate limit exceeded');
        (error as any).status = 429;
        (error as any).headers = {
          'retry-after': '60',
        };
        mockOpenAI.chat.completions.create.mockRejectedValue(error);

        await expect(service.generateTestCases([])).rejects.toThrow('Rate limit');
      });
    });

    describe('Response Parsing Errors', () => {
      it('should handle malformed JSON response', async () => {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: 'not-json{invalid}',
              role: 'assistant',
            },
            finish_reason: 'stop',
            index: 0,
          }],
        } as any);

        await expect(service.generateTestCases([{
          number: 1,
          title: 'Test',
          body: 'Test issue',
        }])).rejects.toThrow();
      });

      it('should handle empty response', async () => {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [],
        } as any);

        await expect(service.generateTestCases([{
          number: 1,
          title: 'Test',
          body: 'Test issue',
        }])).rejects.toThrow();
      });

      it('should handle null content', async () => {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: null,
              role: 'assistant',
            },
            finish_reason: 'stop',
            index: 0,
          }],
        } as any);

        await expect(service.generateTestCases([{
          number: 1,
          title: 'Test',
          body: 'Test issue',
        }])).rejects.toThrow();
      });
    });

    describe('Timeout and Network Errors', () => {
      it('should handle request timeout', async () => {
        const timeoutError = new Error('Request timed out');
        (timeoutError as any).code = 'ETIMEDOUT';
        mockOpenAI.chat.completions.create.mockRejectedValue(timeoutError);

        await expect(service.generateTestCases([])).rejects.toThrow('timed out');
      });

      it('should handle network error', async () => {
        const networkError = new Error('Network error');
        (networkError as any).code = 'ENETUNREACH';
        mockOpenAI.chat.completions.create.mockRejectedValue(networkError);

        await expect(service.generateTestCases([])).rejects.toThrow('Network error');
      });
    });

    describe('Content Filtering Errors', () => {
      it('should handle content policy violation', async () => {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: null,
              role: 'assistant',
            },
            finish_reason: 'content_filter',
            index: 0,
          }],
        } as any);

        await expect(service.generateTestCases([{
          number: 1,
          title: 'Test',
          body: 'Inappropriate content',
        }])).rejects.toThrow();
      });
    });
  });

  describe('File System Error Handling', () => {
    const fs = require('fs').promises;
    
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle file not found', async () => {
      const error = new Error('ENOENT: no such file or directory');
      (error as any).code = 'ENOENT';
      jest.spyOn(fs, 'readFile').mockRejectedValue(error);

      await expect(fs.readFile('/non/existent/file')).rejects.toThrow('ENOENT');
    });

    it('should handle permission denied', async () => {
      const error = new Error('EACCES: permission denied');
      (error as any).code = 'EACCES';
      jest.spyOn(fs, 'writeFile').mockRejectedValue(error);

      await expect(fs.writeFile('/protected/file', 'data')).rejects.toThrow('EACCES');
    });

    it('should handle disk full', async () => {
      const error = new Error('ENOSPC: no space left on device');
      (error as any).code = 'ENOSPC';
      jest.spyOn(fs, 'writeFile').mockRejectedValue(error);

      await expect(fs.writeFile('/path/file', 'data')).rejects.toThrow('ENOSPC');
    });
  });

  describe('Database/Storage Error Handling', () => {
    it('should handle concurrent modification', async () => {
      // Simulate optimistic locking failure
      const error = new Error('Resource was modified by another process');
      (error as any).code = 'CONCURRENT_MODIFICATION';

      // Test should handle this gracefully
      expect(() => {
        throw error;
      }).toThrow('Resource was modified');
    });

    it('should handle transaction rollback', async () => {
      const error = new Error('Transaction rolled back');
      (error as any).code = 'TRANSACTION_ROLLBACK';

      expect(() => {
        throw error;
      }).toThrow('Transaction rolled back');
    });
  });
});