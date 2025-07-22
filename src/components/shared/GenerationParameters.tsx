'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { EnhancedSlider } from '@/components/ui/enhanced-slider'
import { Badge } from '@/components/ui/badge'
import { 
  Settings,
  Thermometer,
  Hash,
  TestTube2,
  Zap,
  Target,
  Gauge
} from 'lucide-react'

interface GenerationParametersProps {
  temperature: number
  maxTokens: number
  testCount: number
  onTemperatureChange: (value: number) => void
  onMaxTokensChange: (value: number) => void
  onTestCountChange: (value: number) => void
  title?: string
  description?: string
  showPresets?: boolean
}

export function GenerationParameters({
  temperature,
  maxTokens,
  testCount,
  onTemperatureChange,
  onMaxTokensChange,
  onTestCountChange,
  title = "Generation Parameters",
  description = "Fine-tune AI behavior for optimal test case generation",
  showPresets = true
}: GenerationParametersProps) {
  const getTemperatureDescription = (temp: number) => {
    if (temp <= 0.3) return 'Very focused - highly consistent results'
    if (temp <= 0.5) return 'Focused - good balance of consistency and creativity'
    if (temp <= 0.7) return 'Balanced - moderate creativity and variation'
    if (temp <= 0.9) return 'Creative - more varied and diverse outputs'
    return 'Very creative - highly varied and unpredictable results'
  }

  const getTemperatureLabel = (temp: number) => {
    if (temp <= 0.3) return 'Deterministic'
    if (temp <= 0.7) return 'Balanced'
    return 'Creative'
  }

  const getTokensDescription = (tokens: number) => {
    if (tokens <= 1500) return 'Concise test cases with essential information'
    if (tokens <= 2500) return 'Standard detail level for most use cases'
    if (tokens <= 3500) return 'Detailed test cases with comprehensive steps'
    return 'Very detailed test cases with extensive documentation'
  }

  const applyPreset = (preset: 'conservative' | 'balanced' | 'creative') => {
    switch (preset) {
      case 'conservative':
        onTemperatureChange(0.3)
        onMaxTokensChange(1500)
        onTestCountChange(3)
        break
      case 'balanced':
        onTemperatureChange(0.7)
        onMaxTokensChange(2000)
        onTestCountChange(5)
        break
      case 'creative':
        onTemperatureChange(0.9)
        onMaxTokensChange(3000)
        onTestCountChange(8)
        break
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Buttons */}
        {showPresets && (
          <>
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Quick Presets
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('conservative')}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <Gauge className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Conservative</span>
                  <span className="text-xs text-muted-foreground">Consistent & Focused</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('balanced')}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <Gauge className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Balanced</span>
                  <span className="text-xs text-muted-foreground">Recommended</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('creative')}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <Gauge className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Creative</span>
                  <span className="text-xs text-muted-foreground">Varied & Detailed</span>
                </Button>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Temperature Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="temperature" className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Temperature
            </Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {temperature}
              </Badge>
              <Badge variant={temperature <= 0.3 ? 'default' : temperature <= 0.7 ? 'secondary' : 'destructive'}>
                {getTemperatureLabel(temperature)}
              </Badge>
            </div>
          </div>
          <div className="space-y-4">
            <EnhancedSlider
              value={[temperature]}
              onValueChange={([value]) => onTemperatureChange(value)}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
              showTicks={true}
              tickCount={11}
              trackHeight="md"
              thumbSize="md"
            />
            <div className="flex justify-between text-sm font-medium text-muted-foreground px-1">
              <span>0.0 (Deterministic)</span>
              <span>1.0 (Creative)</span>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
              {getTemperatureDescription(temperature)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Max Tokens Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="max-tokens" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Max Tokens
            </Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {maxTokens}
              </Badge>
              <Badge variant="secondary">
                {maxTokens <= 1500 ? 'Concise' : maxTokens <= 2500 ? 'Standard' : maxTokens <= 3500 ? 'Detailed' : 'Comprehensive'}
              </Badge>
            </div>
          </div>
          <div className="space-y-4">
            <EnhancedSlider
              value={[maxTokens]}
              onValueChange={([value]) => onMaxTokensChange(value)}
              max={4000}
              min={500}
              step={100}
              className="w-full"
              showTicks={true}
              tickCount={8}
              trackHeight="md"
              thumbSize="md"
            />
            <div className="flex justify-between text-sm font-medium text-muted-foreground px-1">
              <span>500 (Concise)</span>
              <span>4000 (Detailed)</span>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
              {getTokensDescription(maxTokens)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Test Count Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="test-count" className="flex items-center gap-2">
              <TestTube2 className="h-4 w-4" />
              Default Test Count
            </Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {testCount}
              </Badge>
              <Badge variant="secondary">
                {testCount === 1 ? 'test' : 'tests'}
              </Badge>
            </div>
          </div>
          <div className="space-y-4">
            <EnhancedSlider
              value={[testCount]}
              onValueChange={([value]) => onTestCountChange(value)}
              max={20}
              min={1}
              step={1}
              className="w-full"
              showTicks={true}
              tickCount={10}
              trackHeight="md"
              thumbSize="md"
            />
            <div className="flex justify-between text-sm font-medium text-muted-foreground px-1">
              <span>1 test</span>
              <span>20 tests</span>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
              Number of test cases to generate per GitHub issue by default
            </p>
          </div>
        </div>

        {/* Usage Estimation */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Estimated Usage</span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            With current settings, generating {testCount} test cases will use approximately{' '}
            <strong>{Math.round(maxTokens * testCount * 1.2)}</strong> tokens per issue.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}