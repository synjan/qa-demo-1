'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { getUserType } from '@/lib/guest-auth'
import { 
  TestTube2, 
  FolderOpen, 
  GitBranch, 
  BarChart3, 
  Settings, 
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme/theme-toggle'

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Test Cases', href: '/testcases', icon: TestTube2 },
  { name: 'Test Plans', href: '/testplans', icon: FolderOpen },
  { name: 'GitHub Issues', href: '/github', icon: GitBranch },
]

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userType, setUserType] = useState<'github' | 'guest' | 'none'>('none')
  const pathname = usePathname()
  const { data: session } = useSession()

  useEffect(() => {
    setUserType(getUserType())
  }, [])

  // Redirect guests to test-runner if they try to access main app
  useEffect(() => {
    if (userType === 'guest' && !pathname.startsWith('/test-runner')) {
      window.location.href = '/test-runner'
    }
  }, [userType, pathname])

  // Don't show navigation on sign-in page or in test-runner section (has its own nav)
  if (pathname === '/auth/signin' || pathname.startsWith('/test-runner')) {
    return null
  }

  return (
    <nav className="bg-card shadow-sm border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <TestTube2 className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-foreground">QA Manager</span>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navigation.map((item) => {
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
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                      <AvatarFallback>
                        {session.user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>{session.user?.name}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/signin">
                <Button>Sign In</Button>
              </Link>
            )}
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
            {navigation.map((item) => {
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
          {session && (
            <div className="pt-4 pb-3 border-t border-border">
              <div className="flex items-center px-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                  <AvatarFallback>
                    {session.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <div className="text-base font-medium text-foreground">
                    {session.user?.name}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {session.user?.email}
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
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}