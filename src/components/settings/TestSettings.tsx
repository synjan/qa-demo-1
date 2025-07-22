'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  TestTube2, 
  Timer, 
  Save,
  Clock
} from 'lucide-react'
import { UserPreferences } from '@/lib/user-preferences'

interface TestSettingsProps {
  preferences: UserPreferences
  onChange: (updates: Partial<UserPreferences>) => void
}

export function TestSettings({ preferences, onChange }: TestSettingsProps) {
  const [customTimeout, setCustomTimeout] = useState(preferences.testExecution.defaultTimeout.toString())

  const handleTimeoutChange = (value: string) => {
    const numValue = parseInt(value) || 30000
    setCustomTimeout(value)
    onChange({
      testExecution: {
        ...preferences.testExecution,
        defaultTimeout: numValue
      }
    })
  }

  const handleAutoSaveChange = (checked: boolean) => {
    onChange({
      testExecution: {
        ...preferences.testExecution,
        autoSave: checked
      }
    })
  }


  const formatTimeout = (milliseconds: number) => {
    if (milliseconds < 1000) return `${milliseconds}ms`
    if (milliseconds < 60000) return `${milliseconds / 1000}s`
    return `${Math.round(milliseconds / 60000)}m ${Math.round((milliseconds % 60000) / 1000)}s`
  }


  return (
    <div className="space-y-6">
      {/* Test Execution Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" />
            Test Execution
          </CardTitle>
          <CardDescription>
            Configure how tests are executed and monitored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="timeout" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Default Test Timeout
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="timeout"
                type="number"
                value={customTimeout}
                onChange={(e) => handleTimeoutChange(e.target.value)}
                placeholder="30000"
                className="w-32"
                min="1000"
                max="300000"
                step="1000"
              />
              <span className="text-sm text-muted-foreground">milliseconds</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Currently set to: <strong>{formatTimeout(preferences.testExecution.defaultTimeout)}</strong>
            </p>
            <div className="mt-3">
              <div className="grid grid-cols-4 gap-2 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTimeoutChange('15000')}
                  className={preferences.testExecution.defaultTimeout === 15000 ? 'ring-2 ring-primary' : ''}
                >
                  15s
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTimeoutChange('30000')}
                  className={preferences.testExecution.defaultTimeout === 30000 ? 'ring-2 ring-primary' : ''}
                >
                  30s
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTimeoutChange('60000')}
                  className={preferences.testExecution.defaultTimeout === 60000 ? 'ring-2 ring-primary' : ''}
                >
                  1m
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTimeoutChange('120000')}
                  className={preferences.testExecution.defaultTimeout === 120000 ? 'ring-2 ring-primary' : ''}
                >
                  2m
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-save" className="text-base font-medium flex items-center gap-2">
                <Save className="h-4 w-4" />
                Auto-save Test Results
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically save test results after each step completion
              </p>
            </div>
            <Switch
              id="auto-save"
              checked={preferences.testExecution.autoSave}
              onCheckedChange={handleAutoSaveChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}