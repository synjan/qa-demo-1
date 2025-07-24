import { Verifier } from '@pact-foundation/pact';
import path from 'path';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

describe('Provider Contract Verification', () => {
  let server: any;
  const port = 8994;
  const app = next({ dev: false });
  const handle = app.getRequestHandler();

  beforeAll(async () => {
    await app.prepare();
    
    server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    await new Promise<void>((resolve) => {
      server.listen(port, () => {
        console.log(`Provider API listening on port ${port}`);
        resolve();
      });
    });
  }, 30000);

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('QA Test Manager API Provider', () => {
    it('should validate the expectations of QA Test Manager Frontend', async () => {
      const opts = {
        provider: 'QA Test Manager API',
        providerBaseUrl: `http://localhost:${port}`,
        pactUrls: [
          path.resolve(
            process.cwd(),
            'pacts',
            'qa_test_manager_frontend-qa_test_manager_api.json'
          ),
        ],
        publishVerificationResult: false,
        providerVersion: '1.0.0',
        logLevel: 'warn' as const,
        stateHandlers: {
          'test cases exist': async () => {
            // Set up test data
            console.log('Setting up: test cases exist');
          },
          'authenticated user': async () => {
            // Set up authenticated user
            console.log('Setting up: authenticated user');
          },
          'test plan exists': async () => {
            // Set up test plan
            console.log('Setting up: test plan exists');
          },
          'test run exists': async () => {
            // Set up test run
            console.log('Setting up: test run exists');
          },
          'user is not authenticated': async () => {
            // Clear any auth
            console.log('Setting up: user is not authenticated');
          },
        },
        requestFilter: (req: any, res: any, next: any) => {
          // Add any request filtering/modification here
          // For example, inject auth headers for authenticated states
          if (req.headers.authorization === 'Bearer test-token') {
            req.headers['x-test-auth'] = 'true';
          }
          next();
        },
      };

      const verifier = new Verifier(opts);
      
      await verifier.verifyProvider();
    }, 30000);
  });

  describe('GitHub API Provider', () => {
    it('should validate the expectations of QA Test Manager', async () => {
      // Note: This would typically be run against the actual GitHub API
      // or a mock server that simulates GitHub API behavior
      
      const opts = {
        provider: 'GitHub API',
        providerBaseUrl: 'https://api.github.com',
        pactUrls: [
          path.resolve(
            process.cwd(),
            'pacts',
            'qa_test_manager-github_api.json'
          ),
        ],
        publishVerificationResult: false,
        providerVersion: 'v3',
        logLevel: 'warn' as const,
        stateHandlers: {
          'user has repositories': async () => {
            console.log('Setting up: user has repositories');
          },
          'repository has issues': async () => {
            console.log('Setting up: repository has issues');
          },
          'repository exists': async () => {
            console.log('Setting up: repository exists');
          },
          'user is not authenticated': async () => {
            console.log('Setting up: user is not authenticated');
          },
        },
        // Custom request filter to handle auth
        requestFilter: (req: any, res: any, next: any) => {
          // Replace test token with real token if needed
          if (req.headers.authorization === 'token test-github-token') {
            req.headers.authorization = `token ${process.env.GITHUB_TEST_TOKEN || 'test-github-token'}`;
          }
          next();
        },
        // Enable pending pacts
        enablePending: true,
        // Include WIP pacts
        includeWipPactsSince: '2023-01-01',
      };

      // Skip this test in CI unless we have a test token
      if (!process.env.GITHUB_TEST_TOKEN && process.env.CI) {
        console.log('Skipping GitHub API provider verification in CI without test token');
        return;
      }

      const verifier = new Verifier(opts);
      
      try {
        await verifier.verifyProvider();
      } catch (error) {
        console.error('GitHub API provider verification failed:', error);
        // Don't fail the test for external API
        if (!process.env.CI) {
          throw error;
        }
      }
    }, 30000);
  });
});