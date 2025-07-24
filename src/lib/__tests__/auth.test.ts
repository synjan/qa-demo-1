import { getServerSession } from 'next-auth'
import { getSession } from 'next-auth/react'
import { getServerAuth, getClientAuth, getGitHubToken, requireAuth } from '../auth'

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('next-auth/react', () => ({
  getSession: jest.fn()
}))

describe('auth utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getServerAuth', () => {
    it('should return session from getServerSession', async () => {
      const mockSession = { user: { email: 'test@example.com' } }
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const result = await getServerAuth()
      
      expect(result).toEqual(mockSession)
      expect(getServerSession).toHaveBeenCalled()
    })

    it('should return null when no session', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const result = await getServerAuth()
      
      expect(result).toBeNull()
    })
  })

  describe('getClientAuth', () => {
    it('should return session from getSession', async () => {
      const mockSession = { user: { email: 'test@example.com' } }
      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const result = await getClientAuth()
      
      expect(result).toEqual(mockSession)
      expect(getSession).toHaveBeenCalled()
    })
  })

  describe('getGitHubToken', () => {
    beforeEach(() => {
      // Clear localStorage
      Storage.prototype.getItem = jest.fn()
    })

    it('should return token from localStorage', () => {
      const mockToken = 'ghp_test123'
      ;(Storage.prototype.getItem as jest.Mock).mockReturnValue(mockToken)

      const token = getGitHubToken()
      
      expect(token).toBe(mockToken)
      expect(localStorage.getItem).toHaveBeenCalledWith('github_pat')
    })

    it('should return null when no token in localStorage', () => {
      ;(Storage.prototype.getItem as jest.Mock).mockReturnValue(null)

      const token = getGitHubToken()
      
      expect(token).toBeNull()
    })
  })

  describe('requireAuth', () => {
    it('should return session when authenticated', async () => {
      const mockSession = { user: { email: 'test@example.com' } }
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const result = await requireAuth()
      
      expect(result).toEqual(mockSession)
    })

    it('should throw error when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      await expect(requireAuth()).rejects.toThrow('Authentication required')
    })
  })

})