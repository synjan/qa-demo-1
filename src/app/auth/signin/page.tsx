'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Github } from 'lucide-react'

export default function SignIn() {
  const [pat, setPat] = useState('')
  const [loading, setLoading] = useState(false)
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">QA Test Manager</CardTitle>
          <CardDescription>
            Sign in to access your GitHub repositories and manage test cases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                  Or use personal access token
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
                Create a token with 'repo' and 'read:user' scopes
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