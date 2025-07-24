import { TestCaseFactory } from '../factories';

export interface TestCaseAPIContext {
  makeRequest: (method: string, endpoint: string, data?: any) => Promise<any>;
  authenticate: () => void;
  clearAuth: () => void;
}

/**
 * Shared tests for Test Case API functionality
 */
export function runTestCaseAPITests(getContext: () => TestCaseAPIContext) {
  describe('Test Case API Common Tests', () => {
    let context: TestCaseAPIContext;

    beforeEach(() => {
      context = getContext();
      context.authenticate();
    });

    afterEach(() => {
      context.clearAuth();
    });

    describe('CRUD Operations', () => {
      it('should create a test case', async () => {
        const testCase = TestCaseFactory.testCase();
        const result = await context.makeRequest('POST', '/api/testcases', testCase);

        expect(result.status || result.statusCode).toBe(201);
        expect(result.data || result.body).toMatchObject({
          id: expect.any(String),
          title: testCase.title,
          priority: testCase.priority
        });
      });

      it('should list test cases', async () => {
        const result = await context.makeRequest('GET', '/api/testcases');

        expect(result.status || result.statusCode).toBe(200);
        expect(Array.isArray(result.data || result.body)).toBe(true);
      });

      it('should get single test case', async () => {
        const testCase = TestCaseFactory.testCase();
        const createResult = await context.makeRequest('POST', '/api/testcases', testCase);
        const id = (createResult.data || createResult.body).id;

        const result = await context.makeRequest('GET', `/api/testcases/${id}`);

        expect(result.status || result.statusCode).toBe(200);
        expect(result.data || result.body).toMatchObject({
          id,
          title: testCase.title
        });
      });

      it('should update test case', async () => {
        const testCase = TestCaseFactory.testCase();
        const createResult = await context.makeRequest('POST', '/api/testcases', testCase);
        const id = (createResult.data || createResult.body).id;

        const updates = { title: 'Updated Title', priority: 'high' };
        const result = await context.makeRequest('PUT', `/api/testcases/${id}`, updates);

        expect(result.status || result.statusCode).toBe(200);
        expect(result.data || result.body).toMatchObject({
          id,
          title: updates.title,
          priority: updates.priority
        });
      });

      it('should delete test case', async () => {
        const testCase = TestCaseFactory.testCase();
        const createResult = await context.makeRequest('POST', '/api/testcases', testCase);
        const id = (createResult.data || createResult.body).id;

        const result = await context.makeRequest('DELETE', `/api/testcases/${id}`);

        expect(result.status || result.statusCode).toBe(204);

        // Verify deletion
        await expect(
          context.makeRequest('GET', `/api/testcases/${id}`)
        ).rejects.toMatchObject({
          status: 404
        });
      });
    });

    describe('Validation', () => {
      it('should reject invalid test case data', async () => {
        const invalidData = { title: '' }; // Missing required fields

        await expect(
          context.makeRequest('POST', '/api/testcases', invalidData)
        ).rejects.toMatchObject({
          status: 400
        });
      });

      it('should reject test case with invalid priority', async () => {
        const testCase = TestCaseFactory.testCase({ priority: 'invalid' as any });

        await expect(
          context.makeRequest('POST', '/api/testcases', testCase)
        ).rejects.toMatchObject({
          status: 400
        });
      });

      it('should handle missing test case gracefully', async () => {
        await expect(
          context.makeRequest('GET', '/api/testcases/non-existent-id')
        ).rejects.toMatchObject({
          status: 404
        });
      });
    });

    describe('Authorization', () => {
      it('should reject unauthenticated requests', async () => {
        context.clearAuth();

        await expect(
          context.makeRequest('GET', '/api/testcases')
        ).rejects.toMatchObject({
          status: 401
        });
      });

      it('should allow authenticated requests', async () => {
        context.authenticate();

        const result = await context.makeRequest('GET', '/api/testcases');
        expect(result.status || result.statusCode).toBe(200);
      });
    });

    describe('Filtering and Sorting', () => {
      it('should filter test cases by tag', async () => {
        // Create test cases with different tags
        await context.makeRequest('POST', '/api/testcases', 
          TestCaseFactory.testCase({ tags: ['smoke'] })
        );
        await context.makeRequest('POST', '/api/testcases', 
          TestCaseFactory.testCase({ tags: ['regression'] })
        );

        const result = await context.makeRequest('GET', '/api/testcases?tag=smoke');
        const data = result.data || result.body;

        expect(Array.isArray(data)).toBe(true);
        data.forEach((tc: any) => {
          expect(tc.tags).toContain('smoke');
        });
      });

      it('should filter by priority', async () => {
        await context.makeRequest('POST', '/api/testcases', 
          TestCaseFactory.testCase({ priority: 'high' })
        );
        await context.makeRequest('POST', '/api/testcases', 
          TestCaseFactory.testCase({ priority: 'low' })
        );

        const result = await context.makeRequest('GET', '/api/testcases?priority=high');
        const data = result.data || result.body;

        expect(Array.isArray(data)).toBe(true);
        data.forEach((tc: any) => {
          expect(tc.priority).toBe('high');
        });
      });

      it('should sort test cases', async () => {
        const result = await context.makeRequest('GET', '/api/testcases?sort=createdAt&order=desc');
        const data = result.data || result.body;

        expect(Array.isArray(data)).toBe(true);
        if (data.length > 1) {
          const dates = data.map((tc: any) => new Date(tc.createdAt).getTime());
          expect(dates).toEqual([...dates].sort((a, b) => b - a));
        }
      });
    });

    describe('Pagination', () => {
      it('should paginate results', async () => {
        // Create multiple test cases
        await Promise.all(
          Array.from({ length: 15 }, () => 
            context.makeRequest('POST', '/api/testcases', TestCaseFactory.testCase())
          )
        );

        const result = await context.makeRequest('GET', '/api/testcases?page=1&limit=10');
        const data = result.data || result.body;

        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeLessThanOrEqual(10);
      });
    });
  });
}

/**
 * Performance tests for Test Case API
 */
export function runTestCaseAPIPerformanceTests(getContext: () => TestCaseAPIContext) {
  describe('Test Case API Performance', () => {
    let context: TestCaseAPIContext;

    beforeEach(() => {
      context = getContext();
      context.authenticate();
    });

    it('should handle bulk operations efficiently', async () => {
      const testCases = TestCaseFactory.testCases(10);
      
      const start = Date.now();
      await Promise.all(
        testCases.map(tc => context.makeRequest('POST', '/api/testcases', tc))
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // 5 seconds for 10 creates
    });

    it('should fetch large datasets quickly', async () => {
      const start = Date.now();
      await context.makeRequest('GET', '/api/testcases?limit=100');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // 1 second for 100 items
    });
  });
}