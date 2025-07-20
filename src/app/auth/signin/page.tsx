'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Github, TestTube2, User } from 'lucide-react'

export default function SignIn() {
  const [pat, setPat] = useState('')
  const [guestName, setGuestName] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push('/')
      }
    })
  }, [router])

  const handleGitHubSignIn = () => {
    setLoading(true)
    signIn('github', { callbackUrl: '/' })
  }

  const handlePATSignIn = () => {
    if (pat.trim()) {
      localStorage.setItem('github_pat', pat)
      router.push('/')
    }
  }

  const handleGuestSignIn = async () => {
    if (!guestName.trim()) return
    
    setGuestLoading(true)
    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: guestName.trim(),
          role: 'guest'
        })
      })

      if (response.ok) {
        const { sessionId } = await response.json()
        localStorage.setItem('guest_session', sessionId)
        localStorage.setItem('guest_name', guestName.trim())
        router.push('/test-runner')
      } else {
        throw new Error('Failed to create guest session')
      }
    } catch (error) {
      console.error('Guest sign-in error:', error)
    } finally {
      setGuestLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">QA Test Manager</CardTitle>
          <CardDescription>
            Choose your access level based on your role and needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Guest Access Section */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">Test Runner Access</h3>
              <p className="text-sm text-muted-foreground">For UA testers and expert system users</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guestName">Your Name</Label>
              <Input
                id="guestName"
                type="text"
                placeholder="Enter your name for audit trail"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>
            
            <Button
              onClick={handleGuestSignIn}
              disabled={!guestName.trim() || guestLoading}
              className="w-full"
              size="lg"
            >
              <TestTube2 className="mr-2 h-4 w-4" />
              {guestLoading ? 'Signing in...' : 'Access Test Runner'}
            </Button>
            
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Guest Access includes:</strong>
              <br />• Run test cases and test plans
              <br />• Record test results and notes
              <br />• View test execution history
              <br />• Browse available test cases
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Developers & Admins
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleGitHubSignIn}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <Github className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or use GitHub PAT
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pat">GitHub Personal Access Token</Label>
              <Input
                id="pat"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Create a token with &apos;repo&apos; and &apos;read:user&apos; scopes for full access
              </p>
            </div>
            
            <Button
              onClick={handlePATSignIn}
              disabled={!pat.trim()}
              variant="outline"
              className="w-full"
            >
              Continue with PAT
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}