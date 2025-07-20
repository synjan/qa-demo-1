import { getServerSession } from 'next-auth'
import { getSession } from 'next-auth/react'

export async function getServerAuth() {
  return await getServerSession()
}

export async function getClientAuth() {
  return await getSession()
}

export function getGitHubToken(): string | null {
  if (typeof window === 'undefined') return null
  
  // Try to get token from localStorage (PAT)
  const pat = localStorage.getItem('github_pat')
  if (pat) return pat
  
  return null
}

export async function requireAuth() {
  const session = await getServerAuth()
  if (!session) {
    throw new Error('Authentication required')
  }
  return session
}