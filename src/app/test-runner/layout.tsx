'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { 
  TestTube2, 
  BarChart3, 
  Search, 
  FolderOpen, 
  History,
  FileText,
  LogOut,
  Menu,
  X,
  User
} from 'lucide-react'
import { getGuestSession, signOutGuest } from '@/lib/guest-auth'

const guestNavigation = [
  { name: 'Dashboard', href: '/test-runner', icon: BarChart3 },
  { name: 'Browse Tests', href: '/test-runner/browse', icon: Search },
  { name: 'Test Plans', href: '/test-runner/plans', icon: FolderOpen },
  { name: 'Execution History', href: '/test-runner/history', icon: History },
  { name: 'Reports', href: '/test-runner/reports', icon: FileText },
]

export default function TestRunnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [guestSession, setGuestSession] = useState<{ sessionId: string; name: string } | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const session = getGuestSession()
    if (!session) {
      router.push('/auth/signin')
      return
    }
    setGuestSession(session)
  }, [router])

  const handleSignOut = async () => {
    await signOutGuest()
    router.push('/auth/signin')
  }

  if (!guestSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <TestTube2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verifying session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <TestTube2 className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold text-foreground">Test Runner</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Guest
                </span>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {guestNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-primary text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                      }`}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-500 text-white">
                        {guestSession.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>{guestSession.name}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="md:hidden">
              <Button
                variant="ghost"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-card border-t border-border">
            <div className="pt-2 pb-3 space-y-1">
              {guestNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-accent border-primary text-accent-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent hover:border-muted-foreground'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="pt-4 pb-3 border-t border-border">
              <div className="flex items-center px-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-500 text-white">
                    {guestSession.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <div className="text-base font-medium text-foreground">
                    {guestSession.name}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Guest User
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="px-4 py-2">
                  <ThemeToggle />
                </div>
                <Button
                  variant="ghost"
                  className="block w-full text-left px-4 py-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Test Runner - Guest Access Mode
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Session: {guestSession.name}</span>
              <Link href="/auth/signin" className="hover:text-foreground">
                Need full access?
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}