import { GitHubFactory } from '../factories';

export interface GitHubAPITestContext {
  makeRequest: (endpoint: string, options?: any) => Promise<any>;
  expectError: (endpoint: string, options?: any) => Promise<any>;
}

/**
 * Shared tests for GitHub API functionality
 * Can be used in both unit tests (mocked) and integration tests (real API)
 */
export function runGitHubAPITests(getContext: () => GitHubAPITestContext) {
  describe('GitHub API Common Tests', () => {
    let context: GitHubAPITestContext;

    beforeEach(() => {
      context = getContext();
    });

    describe('Repository Operations', () => {
      it('should fetch repositories with pagination', async () => {
        const result = await context.makeRequest('/user/repos', {
          params: { per_page: 10, page: 1 }
        });

        expect(result).toBeDefined();
        expect(Array.isArray(result.data || result)).toBe(true);
      });

      it('should handle empty repository list', async () => {
        const result = await context.makeRequest('/user/repos', {
          params: { per_page: 100 }
        });

        const data = result.data || result;
        expect(Array.isArray(data)).toBe(true);
      });

      it('should fetch single repository details', async () => {
        const result = await context.makeRequest('/repos/testuser/test-repo');
        const data = result.data || result;

        expect(data).toMatchObject({
          name: expect.any(String),
          full_name: expect.any(String),
          owner: expect.objectContaining({
            login: expect.any(String)
          })
        });
      });
    });

    describe('Issue Operations', () => {
      it('should fetch issues with filters', async () => {
        const result = await context.makeRequest('/repos/testuser/test-repo/issues', {
          params: { state: 'open', labels: 'bug' }
        });

        const data = result.data || result;
        expect(Array.isArray(data)).toBe(true);
      });

      it('should fetch single issue', async () => {
        const result = await context.makeRequest('/repos/testuser/test-repo/issues/1');
        const data = result.data || result;

        expect(data).toMatchObject({
          number: expect.any(Number),
          title: expect.any(String),
          state: expect.stringMatching(/^(open|closed)$/)
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle 404 errors gracefully', async () => {
        await expect(
          context.expectError('/repos/nonexistent/repo')
        ).rejects.toMatchObject({
          status: 404
        });
      });

      it('should handle authentication errors', async () => {
        await expect(
          context.expectError('/user', { noAuth: true })
        ).rejects.toMatchObject({
          status: 401
        });
      });

      it('should handle rate limit errors', async () => {
        // This test might be skipped in real API tests to avoid hitting rate limits
        if (process.env.SKIP_RATE_LIMIT_TEST === 'true') {
          return;
        }

        await expect(
          context.expectError('/user/repos', { simulateRateLimit: true })
        ).rejects.toMatchObject({
          status: 403
        });
      });

      it('should handle malformed requests', async () => {
        await expect(
          context.expectError('/repos///issues')
        ).rejects.toBeDefined();
      });
    });
  });
}

/**
 * Performance test suite for GitHub API
 */
export function runGitHubAPIPerformanceTests(getContext: () => GitHubAPITestContext) {
  describe('GitHub API Performance', () => {
    let context: GitHubAPITestContext;

    beforeEach(() => {
      context = getContext();
    });

    it('should fetch repositories within acceptable time', async () => {
      const start = Date.now();
      await context.makeRequest('/user/repos', { params: { per_page: 100 } });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000); // 2 seconds max
    });

    it('should handle concurrent requests efficiently', async () => {
      const start = Date.now();
      
      await Promise.all([
        context.makeRequest('/user/repos'),
        context.makeRequest('/user'),
        context.makeRequest('/repos/testuser/test-repo/issues')
      ]);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(3000); // 3 seconds for all
    });
  });
}