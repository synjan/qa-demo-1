import { UserFactory } from '../factories';

export interface AuthTestContext {
  login: (credentials?: any) => Promise<any>;
  logout: () => Promise<any>;
  getSession: () => Promise<any>;
  refreshToken: () => Promise<any>;
}

/**
 * Shared authentication tests
 */
export function runAuthTests(getContext: () => AuthTestContext) {
  describe('Authentication Common Tests', () => {
    let context: AuthTestContext;

    beforeEach(() => {
      context = getContext();
    });

    describe('Login Flow', () => {
      it('should login with valid credentials', async () => {
        const result = await context.login({
          provider: 'github',
          token: 'valid-token'
        });

        expect(result).toMatchObject({
          user: expect.objectContaining({
            email: expect.any(String),
            name: expect.any(String)
          })
        });
      });

      it('should reject invalid credentials', async () => {
        await expect(
          context.login({
            provider: 'github',
            token: 'invalid-token'
          })
        ).rejects.toThrow();
      });

      it('should handle missing credentials', async () => {
        await expect(
          context.login({})
        ).rejects.toThrow();
      });
    });

    describe('Session Management', () => {
      it('should get current session when logged in', async () => {
        await context.login({
          provider: 'github',
          token: 'valid-token'
        });

        const session = await context.getSession();

        expect(session).toMatchObject({
          user: expect.objectContaining({
            email: expect.any(String)
          }),
          expires: expect.any(String)
        });
      });

      it('should return null session when not logged in', async () => {
        const session = await context.getSession();
        expect(session).toBeNull();
      });

      it('should clear session on logout', async () => {
        await context.login({
          provider: 'github',
          token: 'valid-token'
        });

        await context.logout();

        const session = await context.getSession();
        expect(session).toBeNull();
      });
    });

    describe('Token Management', () => {
      it('should refresh expired token', async () => {
        await context.login({
          provider: 'github',
          token: 'valid-token'
        });

        const result = await context.refreshToken();

        expect(result).toMatchObject({
          accessToken: expect.any(String),
          expiresIn: expect.any(Number)
        });
      });

      it('should fail to refresh without active session', async () => {
        await expect(
          context.refreshToken()
        ).rejects.toThrow();
      });
    });

    describe('Edge Cases', () => {
      it('should handle concurrent login attempts', async () => {
        const loginPromises = Array.from({ length: 3 }, () =>
          context.login({
            provider: 'github',
            token: 'valid-token'
          })
        );

        const results = await Promise.allSettled(loginPromises);
        
        // At least one should succeed
        expect(results.some(r => r.status === 'fulfilled')).toBe(true);
      });

      it('should handle session timeout gracefully', async () => {
        await context.login({
          provider: 'github',
          token: 'valid-token'
        });

        // Simulate timeout
        await new Promise(resolve => setTimeout(resolve, 100));

        const session = await context.getSession();
        // Session should still be valid or gracefully expired
        expect(session === null || session.user).toBeTruthy();
      });
    });
  });
}

/**
 * OAuth-specific tests
 */
export function runOAuthTests(getContext: () => AuthTestContext & { 
  initiateOAuth: (provider: string) => Promise<any>;
  handleCallback: (code: string, state: string) => Promise<any>;
}) {
  describe('OAuth Flow Tests', () => {
    let context: ReturnType<typeof getContext>;

    beforeEach(() => {
      context = getContext();
    });

    it('should initiate OAuth flow', async () => {
      const result = await context.initiateOAuth('github');

      expect(result).toMatchObject({
        authUrl: expect.stringContaining('github.com/login/oauth'),
        state: expect.any(String)
      });
    });

    it('should handle OAuth callback', async () => {
      const { state } = await context.initiateOAuth('github');
      
      const result = await context.handleCallback('valid-code', state);

      expect(result).toMatchObject({
        user: expect.objectContaining({
          email: expect.any(String)
        })
      });
    });

    it('should reject invalid OAuth state', async () => {
      await expect(
        context.handleCallback('valid-code', 'invalid-state')
      ).rejects.toMatchObject({
        message: expect.stringContaining('state')
      });
    });
  });
}