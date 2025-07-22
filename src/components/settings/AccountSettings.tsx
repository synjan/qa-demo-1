'use client'

import { useState } from 'react'
import { Session } from 'next-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Globe, 
  Shield, 
  ExternalLink,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { UserPreferences, UserPreferencesManager } from '@/lib/user-preferences'

interface AccountSettingsProps {
  preferences: UserPreferences
  onChange: (updates: Partial<UserPreferences>) => void
  session: Session | null
}

const timezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Europe/Oslo', label: 'Oslo' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Australia/Sydney', label: 'Sydney' },
]

export function AccountSettings({ preferences, onChange, session }: AccountSettingsProps) {
  const [displayName, setDisplayName] = useState(
    preferences.profile.displayName || session?.user?.name || ''
  )
  const [email, setEmail] = useState(
    preferences.profile.email || session?.user?.email || ''
  )
  const [timezone, setTimezone] = useState(preferences.profile.timezone)

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value)
    onChange({
      profile: {
        ...preferences.profile,
        displayName: value
      }
    })
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    onChange({
      profile: {
        ...preferences.profile,
        email: value
      }
    })
  }

  const handleTimezoneChange = (value: string) => {
    setTimezone(value)
    onChange({
      profile: {
        ...preferences.profile,
        timezone: value
      }
    })
  }

  const isValidEmail = UserPreferencesManager.validateEmail(email)

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Manage your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage 
                src={session?.user?.image || ''} 
                alt={displayName || 'User'} 
              />
              <AvatarFallback className="text-lg">
                {(displayName || session?.user?.name || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  placeholder="Enter your display name"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="grid gap-4">
            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="your.email@example.com"
                />
                {email && (
                  <div className="flex-shrink-0">
                    {isValidEmail ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {email && !isValidEmail && (
                <p className="text-sm text-red-500 mt-1">Please enter a valid email address</p>
              )}
            </div>

            <div>
              <Label htmlFor="timezone" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Timezone
              </Label>
              <Select value={timezone} onValueChange={handleTimezoneChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Status
          </CardTitle>
          <CardDescription>
            Your account connection and authentication status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">GitHub Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {session ? `Connected as ${session.user?.name}` : 'Using Personal Access Token'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
              Active
            </Badge>
          </div>

          {session && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                  <AvatarFallback>
                    {(session.user?.name || 'U').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">OAuth Connection</p>
                  <p className="text-sm text-muted-foreground">
                    Authenticated via GitHub OAuth
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-1" />
                Manage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data & Privacy
          </CardTitle>
          <CardDescription>
            Manage your data and privacy preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Data Export</p>
              <p className="text-sm text-muted-foreground">
                Download a copy of your test cases, plans, and results
              </p>
            </div>
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Account Deletion</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="outline" className="text-red-600 hover:text-red-700">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}