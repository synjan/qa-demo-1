'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navigation } from '@/components/layout/navigation'
import { Button } from '@/components/ui/button'
import { TestTube2, FolderOpen, GitBranch, Plus, Heart, Upload, Download, BarChart, Copy, Sparkles, Edit3, Zap, Activity, TrendingUp, Clock, Monitor, X } from 'lucide-react'
import { FavoriteTestsModal } from '@/components/modals/FavoriteTestsModal'
import { ImportTestCasesModal } from '@/components/modals/ImportTestCasesModal'
import { ExportResultsModal } from '@/components/modals/ExportResultsModal'
import { CloneTestPlanModal } from '@/components/modals/CloneTestPlanModal'
import { StatsWidget } from '@/components/dashboard/StatsWidget'
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget'
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget'
import { AddWidgetModal } from '@/components/dashboard/AddWidgetModal'
import { UserPreferencesManager } from '@/lib/user-preferences'

const quickActions = [
  {
    title: 'Create Test Case',
    description: 'Create a new test case from scratch',
    icon: Plus,
    href: '/testcases/new',
    color: 'bg-blue-500',
    category: 'creation'
  },
  {
    title: 'Run Favorite Tests',
    description: 'Execute your most frequently used test cases',
    icon: Heart,
    action: 'favorites',
    color: 'bg-red-500',
    category: 'execution'
  },
  {
    title: 'Import Test Cases',
    description: 'Import test cases from CSV, JSON, or other formats',
    icon: Upload,
    action: 'import',
    color: 'bg-green-500',
    category: 'creation'
  },
  {
    title: 'Export Test Results',
    description: 'Export test results and analytics reports',
    icon: Download,
    action: 'export',
    color: 'bg-purple-500',
    category: 'analysis'
  },
  {
    title: 'Clone Test Plan',
    description: 'Duplicate an existing test plan as a starting point',
    icon: Copy,
    action: 'clone',
    color: 'bg-orange-500',
    category: 'creation'
  },
  {
    title: 'AI Test Generator',
    description: 'Generate test cases from any text using AI',
    icon: Sparkles,
    href: '/ai-generator',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    category: 'creation'
  },
  {
    title: 'Generate from GitHub',
    description: 'Create test cases from GitHub issues using AI',
    icon: TestTube2,
    href: '/github',
    color: 'bg-primary',
    category: 'creation'
  },
  {
    title: 'Create Test Plan',
    description: 'Build a new test plan from existing test cases',
    icon: FolderOpen,
    href: '/testplans/new',
    color: 'bg-emerald-500',
    category: 'creation'
  },
  {
    title: 'Browse Issues',
    description: 'View and select GitHub issues for testing',
    icon: GitBranch,
    href: '/github',
    color: 'bg-purple-600',
    category: 'integration'
  }
]

const availableWidgets = [
  { id: 'stats', label: 'Statistics Overview', icon: BarChart, description: 'Test case counts and success rates', category: 'Analytics' },
  { id: 'quick-actions', label: 'Quick Actions', icon: Zap, description: 'Fast access to common tasks', category: 'Actions' },
  { id: 'recent-activity', label: 'Recent Activity', icon: Activity, description: 'Latest test executions and changes', category: 'Activity' },
  { id: 'trending', label: 'Trending Issues', icon: TrendingUp, description: 'Most active GitHub issues', category: 'Analytics' },
  { id: 'schedule', label: 'Test Schedule', icon: Clock, description: 'Upcoming scheduled test runs', category: 'Planning' },
  { id: 'performance', label: 'Performance Metrics', icon: Monitor, description: 'System and test performance data', category: 'Analytics' }
]

interface DashboardStats {
  totalTestCases: number
  totalTestPlans: number
  totalTestRuns: number
  passRate: number
  recentTestRuns: number
  recentTestCases: number
  recentTestPlans: number
  activeTestRuns: number
}

interface Activity {
  id: string
  type: 'test_run' | 'test_case' | 'test_plan'
  title: string
  description: string
  timestamp: string
  status: string
  metadata: Record<string, unknown>
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  
  // Widget management states
  const [enabledWidgets, setEnabledWidgets] = useState<string[]>([])
  const [editMode, setEditMode] = useState(false)
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false)
  
  // Modal states
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showCloneModal, setShowCloneModal] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      const hasToken = typeof window !== 'undefined' && localStorage.getItem('github_pat')
      if (!hasToken) {
        router.push('/auth/signin')
        return
      }
    }
    
    // Load user preferences for enabled widgets
    const preferences = UserPreferencesManager.getUserPreferences()
    setEnabledWidgets(preferences.dashboard.widgets)
    
    // Load dashboard data
    loadDashboardData()
  }, [session, status, router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/activity?limit=5')
      ])
      
      if (!statsResponse.ok || !activityResponse.ok) {
        throw new Error('Failed to load dashboard data')
      }
      
      const [statsData, activityData] = await Promise.all([
        statsResponse.json(),
        activityResponse.json()
      ])
      
      setStats(statsData)
      setActivity(activityData)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }


  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'favorites':
        setShowFavoritesModal(true)
        break
      case 'import':
        setShowImportModal(true)
        break
      case 'export':
        setShowExportModal(true)
        break
      case 'clone':
        setShowCloneModal(true)
        break
      default:
        console.log('Unknown action:', action)
    }
  }

  const handleRemoveWidget = (widgetId: string) => {
    const updatedWidgets = enabledWidgets.filter(id => id !== widgetId)
    setEnabledWidgets(updatedWidgets)
    
    // Update user preferences
    UserPreferencesManager.updatePreferences({
      dashboard: {
        widgets: updatedWidgets
      }
    })
  }

  const handleAddWidget = (widgetId: string) => {
    const updatedWidgets = [...enabledWidgets, widgetId]
    setEnabledWidgets(updatedWidgets)
    
    // Update user preferences
    UserPreferencesManager.updatePreferences({
      dashboard: {
        widgets: updatedWidgets
      }
    })
  }

  const toggleEditMode = () => {
    setEditMode(!editMode)
  }

  const getAvailableWidgets = () => {
    return availableWidgets.filter(widget => !enabledWidgets.includes(widget.id))
  }

  const isWidgetEnabled = (widgetId: string) => {
    return enabledWidgets.includes(widgetId)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="mt-2 text-muted-foreground">
                Welcome to QA Test Manager. Manage your test cases, plans, and GitHub integration.
              </p>
            </div>
            <div className="flex gap-2">
              {getAvailableWidgets().length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddWidgetModal(true)}
                  disabled={editMode}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              )}
              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                onClick={toggleEditMode}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {editMode ? 'Done Editing' : 'Edit Dashboard'}
              </Button>
            </div>
          </div>

          {/* Dynamic Widgets */}
          <div className="space-y-6">
            {isWidgetEnabled('stats') && (
              <StatsWidget
                stats={stats}
                loading={loading}
                editMode={editMode}
                onRemove={() => handleRemoveWidget('stats')}
              />
            )}

            {isWidgetEnabled('quick-actions') && (
              <QuickActionsWidget
                actions={quickActions}
                onQuickAction={handleQuickAction}
                editMode={editMode}
                onRemove={() => handleRemoveWidget('quick-actions')}
              />
            )}

            {isWidgetEnabled('recent-activity') && (
              <RecentActivityWidget
                activity={activity}
                loading={loading}
                onRefresh={loadDashboardData}
                editMode={editMode}
                onRemove={() => handleRemoveWidget('recent-activity')}
              />
            )}

            {/* Future widgets placeholder */}
            {isWidgetEnabled('trending') && (
              <div className="relative">
                {editMode && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 z-10 h-6 w-6 p-0 rounded-full"
                    onClick={() => handleRemoveWidget('trending')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                <div className="p-8 border-2 border-dashed border-muted-foreground/20 rounded-lg text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="font-medium">Trending Issues Widget</p>
                  <p className="text-sm">Coming soon</p>
                </div>
              </div>
            )}

            {isWidgetEnabled('schedule') && (
              <div className="relative">
                {editMode && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 z-10 h-6 w-6 p-0 rounded-full"
                    onClick={() => handleRemoveWidget('schedule')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                <div className="p-8 border-2 border-dashed border-muted-foreground/20 rounded-lg text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="font-medium">Test Schedule Widget</p>
                  <p className="text-sm">Coming soon</p>
                </div>
              </div>
            )}

            {isWidgetEnabled('performance') && (
              <div className="relative">
                {editMode && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 z-10 h-6 w-6 p-0 rounded-full"
                    onClick={() => handleRemoveWidget('performance')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                <div className="p-8 border-2 border-dashed border-muted-foreground/20 rounded-lg text-center text-muted-foreground">
                  <Monitor className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="font-medium">Performance Metrics Widget</p>
                  <p className="text-sm">Coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <FavoriteTestsModal
        open={showFavoritesModal}
        onOpenChange={setShowFavoritesModal}
      />
      <ImportTestCasesModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
      />
      <ExportResultsModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
      />
      <CloneTestPlanModal
        open={showCloneModal}
        onOpenChange={setShowCloneModal}
      />
      <AddWidgetModal
        open={showAddWidgetModal}
        onOpenChange={setShowAddWidgetModal}
        availableWidgets={getAvailableWidgets()}
        onAddWidget={handleAddWidget}
      />
    </div>
  )
}