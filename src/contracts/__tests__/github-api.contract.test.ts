import { Pact } from '@pact-foundation/pact';
import path from 'path';
import axios from 'axios';

describe('GitHub API Contract Tests', () => {
  const provider = new Pact({
    consumer: 'QA Test Manager',
    provider: 'GitHub API',
    port: 8992,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    logLevel: 'warn',
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
  });

  const apiClient = axios.create({
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('when a request for repositories is made', () => {
    beforeEach(() => {
      const interaction = {
        state: 'user has repositories',
        uponReceiving: 'a request for user repositories',
        withRequest: {
          method: 'GET',
          path: '/user/repos',
          headers: {
            Authorization: 'token test-github-token',
            Accept: 'application/vnd.github.v3+json',
          },
          query: {
            sort: 'updated',
            per_page: '100',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: [
            {
              id: 1,
              name: 'test-repo',
              full_name: 'testuser/test-repo',
              private: false,
              owner: {
                login: 'testuser',
                avatar_url: 'https://avatars.githubusercontent.com/u/123',
              },
              description: 'A test repository',
              html_url: 'https://github.com/testuser/test-repo',
              updated_at: '2023-01-01T00:00:00Z',
              stargazers_count: 10,
              forks_count: 5,
              open_issues_count: 2,
              has_issues: true,
            },
          ],
        },
      };

      return provider.addInteraction(interaction);
    });

    it('returns a list of repositories', async () => {
      const response = await apiClient.get(
        `${provider.mockService.baseUrl}/user/repos`,
        {
          headers: {
            Authorization: 'token test-github-token',
          },
          params: {
            sort: 'updated',
            per_page: '100',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
      expect(response.data[0]).toMatchObject({
        id: 1,
        name: 'test-repo',
        full_name: 'testuser/test-repo',
        private: false,
      });
    });
  });

  describe('when a request for issues is made', () => {
    beforeEach(() => {
      const interaction = {
        state: 'repository has issues',
        uponReceiving: 'a request for repository issues',
        withRequest: {
          method: 'GET',
          path: '/repos/testuser/test-repo/issues',
          headers: {
            Authorization: 'token test-github-token',
            Accept: 'application/vnd.github.v3+json',
          },
          query: {
            state: 'open',
            per_page: '100',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: [
            {
              id: 101,
              number: 1,
              title: 'Test Issue',
              body: 'This is a test issue',
              state: 'open',
              labels: [
                {
                  id: 1,
                  name: 'bug',
                  color: 'ff0000',
                  description: 'Something isn\'t working',
                },
              ],
              user: {
                login: 'testuser',
                avatar_url: 'https://avatars.githubusercontent.com/u/123',
              },
              assignee: null,
              comments: 0,
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
              html_url: 'https://github.com/testuser/test-repo/issues/1',
            },
          ],
        },
      };

      return provider.addInteraction(interaction);
    });

    it('returns a list of issues', async () => {
      const response = await apiClient.get(
        `${provider.mockService.baseUrl}/repos/testuser/test-repo/issues`,
        {
          headers: {
            Authorization: 'token test-github-token',
          },
          params: {
            state: 'open',
            per_page: '100',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
      expect(response.data[0]).toMatchObject({
        id: 101,
        number: 1,
        title: 'Test Issue',
        state: 'open',
      });
    });
  });

  describe('when a request for a specific repository is made', () => {
    beforeEach(() => {
      const interaction = {
        state: 'repository exists',
        uponReceiving: 'a request for a specific repository',
        withRequest: {
          method: 'GET',
          path: '/repos/testuser/test-repo',
          headers: {
            Authorization: 'token test-github-token',
            Accept: 'application/vnd.github.v3+json',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: {
            id: 1,
            name: 'test-repo',
            full_name: 'testuser/test-repo',
            private: false,
            owner: {
              login: 'testuser',
              avatar_url: 'https://avatars.githubusercontent.com/u/123',
            },
            description: 'A test repository',
            html_url: 'https://github.com/testuser/test-repo',
            updated_at: '2023-01-01T00:00:00Z',
            stargazers_count: 10,
            forks_count: 5,
            open_issues_count: 2,
            has_issues: true,
          },
        },
      };

      return provider.addInteraction(interaction);
    });

    it('returns repository details', async () => {
      const response = await apiClient.get(
        `${provider.mockService.baseUrl}/repos/testuser/test-repo`,
        {
          headers: {
            Authorization: 'token test-github-token',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        id: 1,
        name: 'test-repo',
        full_name: 'testuser/test-repo',
      });
    });
  });

  describe('when unauthorized request is made', () => {
    beforeEach(() => {
      const interaction = {
        state: 'user is not authenticated',
        uponReceiving: 'an unauthorized request',
        withRequest: {
          method: 'GET',
          path: '/user/repos',
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        },
        willRespondWith: {
          status: 401,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: {
            message: 'Requires authentication',
            documentation_url: 'https://docs.github.com/rest',
          },
        },
      };

      return provider.addInteraction(interaction);
    });

    it('returns 401 error', async () => {
      try {
        await apiClient.get(`${provider.mockService.baseUrl}/user/repos`);
        fail('Expected 401 error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
        expect(error.response.data).toMatchObject({
          message: 'Requires authentication',
        });
      }
    });
  });
});