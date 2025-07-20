export interface GuestSession {
  id: string
  name: string
  role: string
  createdAt: Date
}

export async function validateGuestSession(sessionId: string): Promise<GuestSession | null> {
  try {
    const response = await fetch(`/api/auth/guest?sessionId=${sessionId}`)
    
    if (response.ok) {
      const data = await response.json()
      return data.session
    }
    
    return null
  } catch (error) {
    console.error('Guest session validation error:', error)
    return null
  }
}

export function getGuestSession(): { sessionId: string; name: string } | null {
  if (typeof window === 'undefined') return null
  
  const sessionId = localStorage.getItem('guest_session')
  const name = localStorage.getItem('guest_name')
  
  if (sessionId && name) {
    return { sessionId, name }
  }
  
  return null
}

export async function signOutGuest(): Promise<void> {
  const guestSession = getGuestSession()
  
  if (guestSession) {
    try {
      await fetch(`/api/auth/guest?sessionId=${guestSession.sessionId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error signing out guest:', error)
    }
    
    localStorage.removeItem('guest_session')
    localStorage.removeItem('guest_name')
  }
}

export function isGuestUser(): boolean {
  return getGuestSession() !== null
}

// Helper to check if user has GitHub access (either OAuth or PAT)
export function hasGitHubAccess(): boolean {
  if (typeof window === 'undefined') return false
  
  const hasGitHubPAT = localStorage.getItem('github_pat')
  // Note: We'll also need to check for NextAuth session in components
  
  return !!hasGitHubPAT
}

// User type detection
export type UserType = 'github' | 'guest' | 'none'

export function getUserType(): UserType {
  if (isGuestUser()) return 'guest'
  if (hasGitHubAccess()) return 'github'
  return 'none'
}