'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, 
  Monitor, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Shield,
  Volume2,
  VolumeX,
  Smartphone,
  Clock,
  Filter
} from 'lucide-react'
import { UserPreferences } from '@/lib/user-preferences'

interface NotificationSettingsProps {
  preferences: UserPreferences
  onChange: (updates: Partial<UserPreferences>) => void
}

export function NotificationSettings({ preferences, onChange }: NotificationSettingsProps) {

  const handleBrowserChange = (checked: boolean) => {
    onChange({
      notifications: {
        ...preferences.notifications,
        browser: checked
      }
    })
  }

  const handleTestCompletionChange = (checked: boolean) => {
    onChange({
      notifications: {
        ...preferences.notifications,
        testCompletion: checked
      }
    })
  }

  const handleTestFailureChange = (checked: boolean) => {
    onChange({
      notifications: {
        ...preferences.notifications,
        testFailure: checked
      }
    })
  }

  const handleWeeklyReportsChange = (checked: boolean) => {
    onChange({
      notifications: {
        ...preferences.notifications,
        weeklyReports: checked
      }
    })
  }

  const handleCriticalOnlyChange = (checked: boolean) => {
    onChange({
      notifications: {
        ...preferences.notifications,
        criticalOnly: checked
      }
    })
  }

  const getNotificationCount = () => {
    const { notifications } = preferences
    let count = 0
    if (notifications.testCompletion) count++
    if (notifications.testFailure) count++
    if (notifications.weeklyReports) count++
    return count
  }

  const requestBrowserPermissions = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          // Permission granted
          new Notification('QA Test Manager', {
            body: 'Browser notifications are now enabled!',
            icon: '/favicon.ico'
          })
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error)
      }
    }
  }

  const getBrowserPermissionStatus = () => {
    if ('Notification' in window) {
      return Notification.permission
    }
    return 'unsupported'
  }

  const permissionStatus = getBrowserPermissionStatus()

  return (
    <div className="space-y-6">
      {/* Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Delivery Methods
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Monitor className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <Label htmlFor="browser-notifications" className="text-base font-medium">
                  Browser Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show desktop notifications in your browser
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {permissionStatus === 'denied' && (
                <Badge variant="destructive" className="text-xs">Permission Denied</Badge>
              )}
              {permissionStatus === 'default' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestBrowserPermissions}
                  className="text-xs"
                >
                  Enable
                </Button>
              )}
              {permissionStatus === 'granted' && (
                <Badge variant="default" className="text-xs">Enabled</Badge>
              )}
              <Switch
                id="browser-notifications"
                checked={preferences.notifications.browser && permissionStatus === 'granted'}
                onCheckedChange={handleBrowserChange}
                disabled={permissionStatus !== 'granted'}
              />
            </div>
          </div>

          {permissionStatus === 'unsupported' && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Browser notifications are not supported in this environment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Notification Types
          </CardTitle>
          <CardDescription>
            Configure which events trigger notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">Test Completion</p>
                <p className="text-sm text-muted-foreground">
                  When a test case or test run is completed successfully
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.notifications.testCompletion}
              onCheckedChange={handleTestCompletionChange}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium">Test Failures</p>
                <p className="text-sm text-muted-foreground">
                  When a test case fails or encounters an error
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.notifications.testFailure}
              onCheckedChange={handleTestFailureChange}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Weekly Reports</p>
                <p className="text-sm text-muted-foreground">
                  Summary of test activities and statistics every week
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.notifications.weeklyReports}
              onCheckedChange={handleWeeklyReportsChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Filtering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Notification Filtering
          </CardTitle>
          <CardDescription>
            Control which notifications you receive based on priority
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <Label htmlFor="critical-only" className="text-base font-medium">
                  Critical Issues Only
                </Label>
                <p className="text-sm text-muted-foreground">
                  Only receive notifications for critical failures and high-priority issues
                </p>
              </div>
            </div>
            <Switch
              id="critical-only"
              checked={preferences.notifications.criticalOnly}
              onCheckedChange={handleCriticalOnlyChange}
            />
          </div>

          {preferences.notifications.criticalOnly && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Critical Mode Active</span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                You will only receive notifications for test failures and critical issues. 
                Completion notifications and regular updates are suppressed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Notification Summary
          </CardTitle>
          <CardDescription>
            Overview of your current notification settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {preferences.notifications.browser ? (
                  <Volume2 className="h-4 w-4 text-green-500" />
                ) : (
                  <VolumeX className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium">Status</span>
              </div>
              <p className="text-2xl font-bold">
                {preferences.notifications.browser ? 'Active' : 'Disabled'}
              </p>
              <p className="text-xs text-muted-foreground">Notification delivery</p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Types</span>
              </div>
              <p className="text-2xl font-bold">{getNotificationCount()}</p>
              <p className="text-xs text-muted-foreground">Enabled notification types</p>
            </div>
          </div>

          <div className="space-y-3">
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Monitor className="h-4 w-4" />
                <span className="font-medium">Browser Notifications</span>
              </div>
              <Badge variant={preferences.notifications.browser && permissionStatus === 'granted' ? "default" : "secondary"}>
                {preferences.notifications.browser && permissionStatus === 'granted' ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filter Mode</span>
              </div>
              <Badge variant={preferences.notifications.criticalOnly ? "destructive" : "outline"}>
                {preferences.notifications.criticalOnly ? "Critical Only" : "All Events"}
              </Badge>
            </div>
          </div>

          {!preferences.notifications.browser && (
            <div className="mt-4 p-3 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">No Notifications Enabled</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                You won't receive any notifications. Enable browser notifications to stay updated on test activities.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}