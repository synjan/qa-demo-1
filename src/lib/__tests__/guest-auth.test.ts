// Mock the module before importing
jest.mock('../guest-auth', () => {
  const actualModule = jest.requireActual('../guest-auth');
  return actualModule;
});

import { GuestAuthManager } from '../guest-auth';

describe('GuestAuthManager', () => {
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn()
    };
    
    originalLocalStorage = global.localStorage;
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
  });

  describe('createGuestSession', () => {
    it('should create a guest session with provided name', () => {
      const session = GuestAuthManager.createGuestSession('Test User');

      expect(session).toMatchObject({
        id: expect.any(String),
        name: 'Test User',
        email: 'test-user@guest.local',
        role: 'guest',
        createdAt: expect.any(String)
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'guest_session',
        JSON.stringify(session)
      );
    });

    it('should sanitize the guest name', () => {
      const session = GuestAuthManager.createGuestSession('Test User 123!@#');

      expect(session.name).toBe('Test User 123');
      expect(session.email).toBe('test-user-123@guest.local');
    });

    it('should handle empty name', () => {
      const session = GuestAuthManager.createGuestSession('');

      expect(session.name).toBe('Guest');
      expect(session.email).toBe('guest@guest.local');
    });

    it('should limit name length', () => {
      const longName = 'a'.repeat(100);
      const session = GuestAuthManager.createGuestSession(longName);

      expect(session.name.length).toBeLessThanOrEqual(50);
    });
  });

  describe('getGuestSession', () => {
    it('should return stored session', () => {
      const mockSession = {
        id: 'guest-123',
        name: 'Test User',
        email: 'test@guest.local',
        role: 'guest',
        createdAt: new Date().toISOString()
      };

      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockSession));

      const session = GuestAuthManager.getGuestSession();

      expect(session).toEqual(mockSession);
      expect(localStorage.getItem).toHaveBeenCalledWith('guest_session');
    });

    it('should return null if no session', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      const session = GuestAuthManager.getGuestSession();

      expect(session).toBeNull();
    });

    it('should handle invalid JSON', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('invalid json');

      const session = GuestAuthManager.getGuestSession();

      expect(session).toBeNull();
    });
  });

  describe('clearGuestSession', () => {
    it('should remove guest session', () => {
      GuestAuthManager.clearGuestSession();

      expect(localStorage.removeItem).toHaveBeenCalledWith('guest_session');
    });
  });

  describe('isGuestSession', () => {
    it('should return true when guest session exists', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({
        id: 'guest-123',
        name: 'Test',
        role: 'guest'
      }));

      expect(GuestAuthManager.isGuestSession()).toBe(true);
    });

    it('should return false when no session', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      expect(GuestAuthManager.isGuestSession()).toBe(false);
    });
  });

  describe('server-side safety', () => {
    it('should handle missing localStorage gracefully', () => {
      // Remove localStorage
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        writable: true
      });

      expect(() => GuestAuthManager.createGuestSession('Test')).not.toThrow();
      expect(GuestAuthManager.getGuestSession()).toBeNull();
      expect(() => GuestAuthManager.clearGuestSession()).not.toThrow();
      expect(GuestAuthManager.isGuestSession()).toBe(false);
    });
  });
});