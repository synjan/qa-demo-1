'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIConfigSection } from '@/components/shared/AIConfigSection'
import { GenerationParameters } from '@/components/shared/GenerationParameters'
import { 
  Sparkles, 
  Settings,
  ExternalLink
} from 'lucide-react'
import { UserPreferences, UserPreferencesManager } from '@/lib/user-preferences'
import { SettingsSync } from '@/lib/settings-sync'

interface AISettingsProps {
  preferences: UserPreferences
  onChange: (updates: Partial<UserPreferences>) => void
}

export function AISettings({ preferences, onChange }: AISettingsProps) {
  const router = useRouter()
  const [apiKey, setApiKey] = useState(preferences.ai.apiKey || '')
  
  // Sync settings when preferences change
  const syncSettings = (updatedPreferences: UserPreferences) => {
    onChange(updatedPreferences)
    SettingsSync.syncFromUserPreferences(updatedPreferences)
  }

  const handleModelChange = (value: 'gpt-4' | 'gpt-3.5-turbo') => {
    const updated = {
      ...preferences,
      ai: {
        ...preferences.ai,
        defaultModel: value
      }
    }
    syncSettings(updated)
  }

  const handleApiKeyChange = (value: string) => {
    setApiKey(value)
    const updated = {
      ...preferences,
      ai: {
        ...preferences.ai,
        apiKey: value
      }
    }
    syncSettings(updated)
  }

  const handleTemperatureChange = (value: number) => {
    const updated = {
      ...preferences,
      ai: {
        ...preferences.ai,
        defaultParameters: {
          ...preferences.ai.defaultParameters,
          temperature: value
        }
      }
    }
    syncSettings(updated)
  }

  const handleMaxTokensChange = (value: number) => {
    const updated = {
      ...preferences,
      ai: {
        ...preferences.ai,
        defaultParameters: {
          ...preferences.ai.defaultParameters,
          maxTokens: value
        }
      }
    }
    syncSettings(updated)
  }

  const handleTestCountChange = (value: number) => {
    const updated = {
      ...preferences,
      ai: {
        ...preferences.ai,
        defaultParameters: {
          ...preferences.ai.defaultParameters,
          testCount: value
        }
      }
    }
    syncSettings(updated)
  }

  const handleAdvancedClick = () => {
    router.push('/ai-generator/settings')
  }


  return (
    <div className="space-y-6">
      {/* AI Configuration */}
      <AIConfigSection
        apiKey={apiKey}
        defaultModel={preferences.ai.defaultModel}
        onApiKeyChange={handleApiKeyChange}
        onModelChange={handleModelChange}
        showAdvancedLink={true}
        onAdvancedClick={handleAdvancedClick}
      />

      {/* Generation Parameters */}
      <GenerationParameters
        temperature={preferences.ai.defaultParameters.temperature}
        maxTokens={preferences.ai.defaultParameters.maxTokens}
        testCount={preferences.ai.defaultParameters.testCount}
        onTemperatureChange={handleTemperatureChange}
        onMaxTokensChange={handleMaxTokensChange}
        onTestCountChange={handleTestCountChange}
      />

      {/* Quick Access to Advanced Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced AI Settings
          </CardTitle>
          <CardDescription>
            Access specialized AI generation features and templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <h4 className="font-medium">AI Generator Settings</h4>
              <p className="text-sm text-muted-foreground">
                Template management, streaming mode, language preferences, and detailed focus areas
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleAdvancedClick}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Advanced Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}