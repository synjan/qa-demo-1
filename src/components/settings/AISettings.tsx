'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { 
  Sparkles, 
  Key, 
  Brain, 
  Thermometer,
  FileText,
  Hash,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Zap,
  Settings,
  TestTube2
} from 'lucide-react'
import { UserPreferences, UserPreferencesManager } from '@/lib/user-preferences'

interface AISettingsProps {
  preferences: UserPreferences
  onChange: (updates: Partial<UserPreferences>) => void
}

export function AISettings({ preferences, onChange }: AISettingsProps) {
  const [apiKey, setApiKey] = useState(preferences.ai.apiKey || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [keyValid, setKeyValid] = useState<boolean | null>(null)
  const [validating, setValidating] = useState(false)

  const handleModelChange = (value: 'gpt-4' | 'gpt-3.5-turbo') => {
    onChange({
      ai: {
        ...preferences.ai,
        defaultModel: value
      }
    })
  }

  const handleApiKeyChange = (value: string) => {
    setApiKey(value)
    setKeyValid(null) // Reset validation status
    onChange({
      ai: {
        ...preferences.ai,
        apiKey: value
      }
    })
  }

  const handleTemperatureChange = (values: number[]) => {
    onChange({
      ai: {
        ...preferences.ai,
        defaultParameters: {
          ...preferences.ai.defaultParameters,
          temperature: values[0]
        }
      }
    })
  }

  const handleMaxTokensChange = (values: number[]) => {
    onChange({
      ai: {
        ...preferences.ai,
        defaultParameters: {
          ...preferences.ai.defaultParameters,
          maxTokens: values[0]
        }
      }
    })
  }

  const handleTestCountChange = (values: number[]) => {
    onChange({
      ai: {
        ...preferences.ai,
        defaultParameters: {
          ...preferences.ai.defaultParameters,
          testCount: values[0]
        }
      }
    })
  }

  const validateApiKey = async () => {
    if (!apiKey || !UserPreferencesManager.validateOpenAIKey(apiKey)) {
      setKeyValid(false)
      return
    }

    setValidating(true)
    try {
      // Simple validation - check if key format is correct
      // In a real implementation, you might make a test API call
      const isValid = UserPreferencesManager.validateOpenAIKey(apiKey)
      setKeyValid(isValid)
      
      // Simulate API validation delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      setKeyValid(false)
    } finally {
      setValidating(false)
    }
  }

  const getModelDescription = (model: string) => {
    switch (model) {
      case 'gpt-4':
        return 'Most capable model, best for complex test case generation'
      case 'gpt-3.5-turbo':
        return 'Faster and more cost-effective, suitable for most use cases'
      default:
        return 'Select a model for AI-powered test case generation'
    }
  }

  const getTemperatureDescription = (temp: number) => {
    if (temp <= 0.3) return 'Very focused - highly consistent results'
    if (temp <= 0.5) return 'Focused - good balance of consistency and creativity'
    if (temp <= 0.7) return 'Balanced - moderate creativity and variation'
    if (temp <= 0.9) return 'Creative - more varied and diverse outputs'
    return 'Very creative - highly varied and unpredictable results'
  }

  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            OpenAI Configuration
          </CardTitle>
          <CardDescription>
            Configure your OpenAI API access for AI-powered test case generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="ai-model" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Default AI Model
            </Label>
            <Select value={preferences.ai.defaultModel} onValueChange={handleModelChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select AI model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">Premium</Badge>
                    GPT-4
                  </div>
                </SelectItem>
                <SelectItem value="gpt-3.5-turbo">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Standard</Badge>
                    GPT-3.5 Turbo
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              {getModelDescription(preferences.ai.defaultModel)}
            </p>
          </div>

          <Separator />

          <div>
            <Label htmlFor="api-key" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              OpenAI API Key
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="sk-..."
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={validateApiKey}
                disabled={validating || !apiKey}
              >
                {validating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Validate'
                )}
              </Button>
            </div>
            
            {/* API Key Status */}
            {apiKey && (
              <div className="flex items-center gap-2 mt-2">
                {keyValid === true && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">API key is valid</span>
                  </>
                )}
                {keyValid === false && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400">Invalid or expired API key</span>
                  </>
                )}
              </div>
            )}
            
            <div className="mt-2">
              <Button variant="link" className="h-auto p-0 text-sm">
                <ExternalLink className="h-3 w-3 mr-1" />
                Get API key from OpenAI
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Generation Parameters
          </CardTitle>
          <CardDescription>
            Fine-tune AI behavior for optimal test case generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="temperature" className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Temperature ({preferences.ai.defaultParameters.temperature})
            </Label>
            <div className="mt-3">
              <Slider
                value={[preferences.ai.defaultParameters.temperature]}
                onValueChange={handleTemperatureChange}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>0.0 (Deterministic)</span>
                <span>1.0 (Creative)</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {getTemperatureDescription(preferences.ai.defaultParameters.temperature)}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <Label htmlFor="max-tokens" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Max Tokens ({preferences.ai.defaultParameters.maxTokens})
            </Label>
            <div className="mt-3">
              <Slider
                value={[preferences.ai.defaultParameters.maxTokens]}
                onValueChange={handleMaxTokensChange}
                max={4000}
                min={500}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>500 (Concise)</span>
                <span>4000 (Detailed)</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Higher values allow for more detailed test cases but cost more tokens
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <Label htmlFor="test-count" className="flex items-center gap-2">
              <TestTube2 className="h-4 w-4" />
              Default Test Count ({preferences.ai.defaultParameters.testCount})
            </Label>
            <div className="mt-3">
              <Slider
                value={[preferences.ai.defaultParameters.testCount]}
                onValueChange={handleTestCountChange}
                max={20}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>1 test</span>
                <span>20 tests</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Number of test cases to generate per GitHub issue by default
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Configuration Summary
          </CardTitle>
          <CardDescription>
            Current AI generation settings overview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Model</span>
              </div>
              <p className="text-2xl font-bold">{preferences.ai.defaultModel.toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">AI engine</p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TestTube2 className="h-4 w-4 text-green-500" />
                <span className="font-medium">Tests</span>
              </div>
              <p className="text-2xl font-bold">{preferences.ai.defaultParameters.testCount}</p>
              <p className="text-xs text-muted-foreground">Per issue</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Temperature</span>
              </div>
              <p className="text-2xl font-bold">{preferences.ai.defaultParameters.temperature}</p>
              <p className="text-xs text-muted-foreground">Creativity level</p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Max Tokens</span>
              </div>
              <p className="text-2xl font-bold">{preferences.ai.defaultParameters.maxTokens}</p>
              <p className="text-xs text-muted-foreground">Response length</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Estimated Usage</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              With current settings, generating {preferences.ai.defaultParameters.testCount} test cases will use approximately{' '}
              <strong>{Math.round(preferences.ai.defaultParameters.maxTokens * preferences.ai.defaultParameters.testCount * 1.2)}</strong> tokens per issue.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}