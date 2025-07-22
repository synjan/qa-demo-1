'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  BarChart3, 
  Layout, 
  Palette, 
  Languages, 
  Monitor,
  Sun,
  Moon,
  Eye,
  Grid,
  List,
  Activity,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react'
import { UserPreferences } from '@/lib/user-preferences'

interface DashboardSettingsProps {
  preferences: UserPreferences
  onChange: (updates: Partial<UserPreferences>) => void
}

const availableWidgets = [
  { id: 'stats', label: 'Statistics Overview', icon: BarChart3, description: 'Test case counts and success rates' },
  { id: 'quick-actions', label: 'Quick Actions', icon: Zap, description: 'Fast access to common tasks' },
  { id: 'recent-activity', label: 'Recent Activity', icon: Activity, description: 'Latest test executions and changes' },
  { id: 'trending', label: 'Trending Issues', icon: TrendingUp, description: 'Most active GitHub issues' },
  { id: 'schedule', label: 'Test Schedule', icon: Clock, description: 'Upcoming scheduled test runs' },
  { id: 'performance', label: 'Performance Metrics', icon: Monitor, description: 'System and test performance data' }
]

export function DashboardSettings({ preferences, onChange }: DashboardSettingsProps) {
  const handleLayoutChange = (value: 'default' | 'compact' | 'detailed') => {
    onChange({
      dashboard: {
        ...preferences.dashboard,
        layout: value
      }
    })
  }

  const handleThemeChange = (value: 'light' | 'dark' | 'auto') => {
    onChange({
      dashboard: {
        ...preferences.dashboard,
        theme: value
      }
    })
  }

  const handleLanguageChange = (value: 'en' | 'no') => {
    onChange({
      dashboard: {
        ...preferences.dashboard,
        language: value
      }
    })
  }

  const handleShowWelcomeChange = (checked: boolean) => {
    onChange({
      dashboard: {
        ...preferences.dashboard,
        showWelcome: checked
      }
    })
  }

  const handleWidgetToggle = (widgetId: string, enabled: boolean) => {
    const currentWidgets = preferences.dashboard.widgets
    let updatedWidgets: string[]
    
    if (enabled && !currentWidgets.includes(widgetId)) {
      updatedWidgets = [...currentWidgets, widgetId]
    } else if (!enabled && currentWidgets.includes(widgetId)) {
      updatedWidgets = currentWidgets.filter(id => id !== widgetId)
    } else {
      return // No change needed
    }

    onChange({
      dashboard: {
        ...preferences.dashboard,
        widgets: updatedWidgets
      }
    })
  }

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />
      case 'dark': return <Moon className="h-4 w-4" />
      default: return <Monitor className="h-4 w-4" />
    }
  }

  const getLayoutIcon = (layout: string) => {
    switch (layout) {
      case 'compact': return <List className="h-4 w-4" />
      case 'detailed': return <Grid className="h-4 w-4" />
      default: return <Layout className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Layout & Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Layout & Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="layout">Dashboard Layout</Label>
            <Select value={preferences.dashboard.layout} onValueChange={handleLayoutChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  <div className="flex items-center gap-2">
                    {getLayoutIcon('default')}
                    Default Layout
                  </div>
                </SelectItem>
                <SelectItem value="compact">
                  <div className="flex items-center gap-2">
                    {getLayoutIcon('compact')}
                    Compact Layout
                  </div>
                </SelectItem>
                <SelectItem value="detailed">
                  <div className="flex items-center gap-2">
                    {getLayoutIcon('detailed')}
                    Detailed Layout
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              {preferences.dashboard.layout === 'compact' && 'Minimalist view with essential information only'}
              {preferences.dashboard.layout === 'detailed' && 'Rich view with comprehensive statistics and insights'}
              {preferences.dashboard.layout === 'default' && 'Balanced view with key metrics and quick access'}
            </p>
          </div>

          <Separator />

          <div>
            <Label htmlFor="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Theme
            </Label>
            <Select value={preferences.dashboard.theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light Theme
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark Theme
                  </div>
                </SelectItem>
                <SelectItem value="auto">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    System Preference
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="language" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Language
            </Label>
            <Select value={preferences.dashboard.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">
                  <div className="flex items-center gap-2">
                    🇺🇸 English
                  </div>
                </SelectItem>
                <SelectItem value="no">
                  <div className="flex items-center gap-2">
                    🇳🇴 Norsk (Norwegian)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Widget Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Dashboard Widgets
          </CardTitle>
          <CardDescription>
            Choose which widgets to display on your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableWidgets.map((widget) => {
            const Icon = widget.icon
            const isEnabled = preferences.dashboard.widgets.includes(widget.id)
            
            return (
              <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-md">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{widget.label}</p>
                    <p className="text-sm text-muted-foreground">{widget.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isEnabled && (
                    <Badge variant="outline" className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                      Enabled
                    </Badge>
                  )}
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleWidgetToggle(widget.id, checked)}
                  />
                </div>
              </div>
            )
          })}
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>{preferences.dashboard.widgets.length}</strong> of {availableWidgets.length} widgets enabled
            </p>
          </div>
        </CardContent>
      </Card>

      {/* User Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            User Experience
          </CardTitle>
          <CardDescription>
            Configure dashboard behavior and user experience settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-welcome" className="text-base font-medium">
                Show Welcome Message
              </Label>
              <p className="text-sm text-muted-foreground">
                Display a welcome message and tips for new users
              </p>
            </div>
            <Switch
              id="show-welcome"
              checked={preferences.dashboard.showWelcome}
              onCheckedChange={handleShowWelcomeChange}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">Dashboard Preview</Label>
            <div className="p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getThemeIcon(preferences.dashboard.theme)}
                  <span className="text-sm font-medium">
                    {preferences.dashboard.theme.charAt(0).toUpperCase() + preferences.dashboard.theme.slice(1)} Theme
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getLayoutIcon(preferences.dashboard.layout)}
                  <span className="text-sm font-medium">
                    {preferences.dashboard.layout.charAt(0).toUpperCase() + preferences.dashboard.layout.slice(1)} Layout
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Your dashboard will show {preferences.dashboard.widgets.length} widgets in {preferences.dashboard.language === 'en' ? 'English' : 'Norwegian'}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}