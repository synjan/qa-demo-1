import { Session } from 'next-auth';

let userIdCounter = 1;

export class UserFactory {
  static reset() {
    userIdCounter = 1;
  }

  static user(overrides: Partial<Session['user']> = {}): Session['user'] {
    const id = userIdCounter++;
    const email = overrides.email || `user${id}@example.com`;
    const name = overrides.name || `Test User ${id}`;
    
    return {
      email,
      name,
      image: overrides.image || `https://avatars.githubusercontent.com/u/${id}`,
      ...overrides,
    };
  }

  static session(overrides: Partial<Session> = {}): Session {
    return {
      user: this.user(overrides.user),
      expires: overrides.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ...overrides,
    };
  }

  static githubUser() {
    return this.user({
      email: 'github@example.com',
      name: 'GitHub User',
      image: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    });
  }

  static adminUser() {
    return this.user({
      email: 'admin@qa-manager.com',
      name: 'Admin User',
    });
  }

  static guestUser() {
    return this.user({
      email: 'guest@qa-manager.com',
      name: 'Guest User',
    });
  }
}