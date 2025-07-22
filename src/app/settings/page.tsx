'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  User, 
  GitBranch, 
  BarChart3, 
  TestTube2, 
  Sparkles, 
  Bell,
  Save,
  RotateCcw,
  CheckCircle
} from 'lucide-react'
import { AccountSettings } from '@/components/settings/AccountSettings'
import { GitHubSettings } from '@/components/settings/GitHubSettings'
import { DashboardSettings } from '@/components/settings/DashboardSettings'
import { TestSettings } from '@/components/settings/TestSettings'
import { AISettings } from '@/components/settings/AISettings'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { UserPreferences, UserPreferencesManager, defaultPreferences } from '@/lib/user-preferences'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [activeTab, setActiveTab] = useState('account')
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load preferences on mount
  useEffect(() => {
    const loadedPreferences = UserPreferencesManager.getUserPreferences()
    setPreferences(loadedPreferences)
  }, [])

  // Authentication check
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      const hasToken = typeof window !== 'undefined' && localStorage.getItem('github_pat')
      if (!hasToken) {
        router.push('/auth/signin')
        return
      }
    }
  }, [session, status, router])

  const handlePreferenceChange = (updates: Partial<UserPreferences>) => {
    const updated = UserPreferencesManager.deepMerge(preferences, updates)
    setPreferences(updated)
    setHasChanges(true)
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      UserPreferencesManager.saveUserPreferences(preferences)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setHasChanges(false)
      setSaveSuccess(true)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    const defaults = UserPreferencesManager.resetToDefaults()
    setPreferences(defaults)
    setHasChanges(true)
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account, preferences, and application settings
          </p>
        </div>
        
        {/* Save Controls */}
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Saved successfully</span>
            </div>
          )}
          
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 dark:text-orange-400">
              Unsaved changes
            </Badge>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="github" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube2 className="h-4 w-4" />
            <span className="hidden sm:inline">Testing</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <AccountSettings 
            preferences={preferences}
            onChange={handlePreferenceChange}
            session={session}
          />
        </TabsContent>

        <TabsContent value="github">
          <GitHubSettings 
            preferences={preferences}
            onChange={handlePreferenceChange}
          />
        </TabsContent>

        <TabsContent value="dashboard">
          <DashboardSettings 
            preferences={preferences}
            onChange={handlePreferenceChange}
          />
        </TabsContent>

        <TabsContent value="testing">
          <TestSettings 
            preferences={preferences}
            onChange={handlePreferenceChange}
          />
        </TabsContent>

        <TabsContent value="ai">
          <AISettings 
            preferences={preferences}
            onChange={handlePreferenceChange}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings 
            preferences={preferences}
            onChange={handlePreferenceChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}