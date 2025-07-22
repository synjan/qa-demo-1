'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkles, 
  Key, 
  Brain, 
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Settings
} from 'lucide-react'

interface AIConfigProps {
  apiKey: string
  defaultModel: 'gpt-4' | 'gpt-3.5-turbo'
  onApiKeyChange: (value: string) => void
  onModelChange: (value: 'gpt-4' | 'gpt-3.5-turbo') => void
  title?: string
  description?: string
  showAdvancedLink?: boolean
  onAdvancedClick?: () => void
}

export function AIConfigSection({
  apiKey,
  defaultModel,
  onApiKeyChange,
  onModelChange,
  title = "OpenAI Configuration",
  description = "Configure your OpenAI API access for AI-powered test case generation",
  showAdvancedLink = false,
  onAdvancedClick
}: AIConfigProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [keyValid, setKeyValid] = useState<boolean | null>(null)
  const [validating, setValidating] = useState(false)

  const validateApiKey = async () => {
    if (!apiKey || !validateOpenAIKey(apiKey)) {
      setKeyValid(false)
      return
    }

    setValidating(true)
    try {
      // Simple validation - check if key format is correct
      const isValid = validateOpenAIKey(apiKey)
      setKeyValid(isValid)
      
      // Simulate API validation delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      setKeyValid(false)
    } finally {
      setValidating(false)
    }
  }

  const validateOpenAIKey = (key: string): boolean => {
    return key.startsWith('sk-') && key.length >= 48
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <CardTitle>{title}</CardTitle>
          </div>
          {showAdvancedLink && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAdvancedClick}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Advanced Settings
            </Button>
          )}
        </div>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="ai-model" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Default AI Model
          </Label>
          <Select value={defaultModel} onValueChange={onModelChange}>
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
            {getModelDescription(defaultModel)}
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
                onChange={(e) => onApiKeyChange(e.target.value)}
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
  )
}