import { Pact } from '@pact-foundation/pact';
import path from 'path';
import axios from 'axios';

describe('QA Test Manager API Contract Tests', () => {
  const provider = new Pact({
    consumer: 'QA Test Manager Frontend',
    provider: 'QA Test Manager API',
    port: 8993,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    logLevel: 'warn',
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
  });

  const apiClient = axios.create({
    headers: {
      'Content-Type': 'application/json',
    },
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('Test Cases API', () => {
    describe('when a request to list test cases is made', () => {
      beforeEach(() => {
        const interaction = {
          state: 'test cases exist',
          uponReceiving: 'a request to list test cases',
          withRequest: {
            method: 'GET',
            path: '/api/testcases',
            headers: {
              Authorization: 'Bearer test-token',
            },
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: [
              {
                id: 'tc-123',
                title: 'Test Login Flow',
                description: 'Verify user can log in',
                priority: 'high',
                tags: ['auth', 'critical'],
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-01T00:00:00Z',
                createdBy: 'testuser',
              },
            ],
          },
        };

        return provider.addInteraction(interaction);
      });

      it('returns a list of test cases', async () => {
        const response = await apiClient.get(`${provider.mockService.baseUrl}/api/testcases`, {
          headers: {
            Authorization: 'Bearer test-token',
          },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveLength(1);
        expect(response.data[0]).toMatchObject({
          id: 'tc-123',
          title: 'Test Login Flow',
          priority: 'high',
        });
      });
    });

    describe('when a request to create a test case is made', () => {
      beforeEach(() => {
        const interaction = {
          state: 'authenticated user',
          uponReceiving: 'a request to create a test case',
          withRequest: {
            method: 'POST',
            path: '/api/testcases',
            headers: {
              Authorization: 'Bearer test-token',
              'Content-Type': 'application/json',
            },
            body: {
              title: 'New Test Case',
              description: 'Test description',
              preconditions: 'User is logged out',
              steps: [
                {
                  action: 'Navigate to login',
                  expectedResult: 'Login page loads',
                },
              ],
              expectedResult: 'User is logged in',
              priority: 'medium',
              tags: ['auth'],
            },
          },
          willRespondWith: {
            status: 201,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              id: 'tc-456',
              title: 'New Test Case',
              description: 'Test description',
              preconditions: 'User is logged out',
              steps: [
                {
                  id: 'step-1',
                  stepNumber: 1,
                  action: 'Navigate to login',
                  expectedResult: 'Login page loads',
                },
              ],
              expectedResult: 'User is logged in',
              priority: 'medium',
              tags: ['auth'],
              createdAt: '2023-01-02T00:00:00Z',
              updatedAt: '2023-01-02T00:00:00Z',
              createdBy: 'testuser',
            },
          },
        };

        return provider.addInteraction(interaction);
      });

      it('creates a new test case', async () => {
        const newTestCase = {
          title: 'New Test Case',
          description: 'Test description',
          preconditions: 'User is logged out',
          steps: [
            {
              action: 'Navigate to login',
              expectedResult: 'Login page loads',
            },
          ],
          expectedResult: 'User is logged in',
          priority: 'medium',
          tags: ['auth'],
        };

        const response = await apiClient.post(
          `${provider.mockService.baseUrl}/api/testcases`,
          newTestCase,
          {
            headers: {
              Authorization: 'Bearer test-token',
            },
          }
        );

        expect(response.status).toBe(201);
        expect(response.data).toMatchObject({
          id: expect.any(String),
          title: 'New Test Case',
          priority: 'medium',
        });
      });
    });
  });

  describe('Test Plans API', () => {
    describe('when a request to create a test plan is made', () => {
      beforeEach(() => {
        const interaction = {
          state: 'test cases exist',
          uponReceiving: 'a request to create a test plan',
          withRequest: {
            method: 'POST',
            path: '/api/testplans',
            headers: {
              Authorization: 'Bearer test-token',
              'Content-Type': 'application/json',
            },
            body: {
              name: 'Release 1.0 Test Plan',
              description: 'Test plan for version 1.0',
              testCaseIds: ['tc-123', 'tc-456'],
            },
          },
          willRespondWith: {
            status: 201,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              id: 'tp-789',
              name: 'Release 1.0 Test Plan',
              description: 'Test plan for version 1.0',
              testCaseIds: ['tc-123', 'tc-456'],
              createdAt: '2023-01-03T00:00:00Z',
              updatedAt: '2023-01-03T00:00:00Z',
              createdBy: 'testuser',
            },
          },
        };

        return provider.addInteraction(interaction);
      });

      it('creates a new test plan', async () => {
        const newTestPlan = {
          name: 'Release 1.0 Test Plan',
          description: 'Test plan for version 1.0',
          testCaseIds: ['tc-123', 'tc-456'],
        };

        const response = await apiClient.post(
          `${provider.mockService.baseUrl}/api/testplans`,
          newTestPlan,
          {
            headers: {
              Authorization: 'Bearer test-token',
            },
          }
        );

        expect(response.status).toBe(201);
        expect(response.data).toMatchObject({
          id: 'tp-789',
          name: 'Release 1.0 Test Plan',
          testCaseIds: ['tc-123', 'tc-456'],
        });
      });
    });
  });

  describe('Test Runs API', () => {
    describe('when a request to start a test run is made', () => {
      beforeEach(() => {
        const interaction = {
          state: 'test plan exists',
          uponReceiving: 'a request to start a test run',
          withRequest: {
            method: 'POST',
            path: '/api/testruns',
            headers: {
              Authorization: 'Bearer test-token',
              'Content-Type': 'application/json',
            },
            body: {
              testPlanId: 'tp-789',
              name: 'Release 1.0 Test Run',
            },
          },
          willRespondWith: {
            status: 201,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              id: 'tr-999',
              testPlanId: 'tp-789',
              name: 'Release 1.0 Test Run',
              status: 'in_progress',
              results: [],
              startedAt: '2023-01-04T00:00:00Z',
              completedAt: null,
              executedBy: 'testuser',
            },
          },
        };

        return provider.addInteraction(interaction);
      });

      it('starts a new test run', async () => {
        const newTestRun = {
          testPlanId: 'tp-789',
          name: 'Release 1.0 Test Run',
        };

        const response = await apiClient.post(
          `${provider.mockService.baseUrl}/api/testruns`,
          newTestRun,
          {
            headers: {
              Authorization: 'Bearer test-token',
            },
          }
        );

        expect(response.status).toBe(201);
        expect(response.data).toMatchObject({
          id: 'tr-999',
          testPlanId: 'tp-789',
          status: 'in_progress',
        });
      });
    });

    describe('when a test result is updated', () => {
      beforeEach(() => {
        const interaction = {
          state: 'test run exists',
          uponReceiving: 'a request to update test result',
          withRequest: {
            method: 'PUT',
            path: '/api/testruns/tr-999/results/tc-123',
            headers: {
              Authorization: 'Bearer test-token',
              'Content-Type': 'application/json',
            },
            body: {
              status: 'passed',
              actualResult: 'User successfully logged in',
              notes: 'No issues found',
            },
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              testCaseId: 'tc-123',
              status: 'passed',
              actualResult: 'User successfully logged in',
              notes: 'No issues found',
              executedAt: '2023-01-04T01:00:00Z',
              executedBy: 'testuser',
            },
          },
        };

        return provider.addInteraction(interaction);
      });

      it('updates test result', async () => {
        const updateData = {
          status: 'passed',
          actualResult: 'User successfully logged in',
          notes: 'No issues found',
        };

        const response = await apiClient.put(
          `${provider.mockService.baseUrl}/api/testruns/tr-999/results/tc-123`,
          updateData,
          {
            headers: {
              Authorization: 'Bearer test-token',
            },
          }
        );

        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
          testCaseId: 'tc-123',
          status: 'passed',
        });
      });
    });
  });

  describe('Authentication API', () => {
    describe('when checking session without auth', () => {
      beforeEach(() => {
        const interaction = {
          state: 'user is not authenticated',
          uponReceiving: 'a request to check session without auth',
          withRequest: {
            method: 'GET',
            path: '/api/auth/session',
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {},
          },
        };

        return provider.addInteraction(interaction);
      });

      it('returns empty session', async () => {
        const response = await apiClient.get(`${provider.mockService.baseUrl}/api/auth/session`);

        expect(response.status).toBe(200);
        expect(response.data).toEqual({});
      });
    });
  });
});