'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Sparkles, 
  Loader2, 
  Copy, 
  Download, 
  Save,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Settings,
  ExternalLink,
  GitBranch,
  FileText,
  Eye
} from 'lucide-react'
import { TestCase, GitHubRepository, GitHubIssue } from '@/lib/types'
import { BilingualService, Language } from '@/lib/language-service'
import { ProgressIndicator } from '@/components/ui/progress-indicator'
import { useAIStreaming } from '@/hooks/use-ai-streaming'
import { RepositoryPicker } from '@/components/github/repository-picker'
import { IssueSelector } from '@/components/github/issue-selector'
import { Navigation } from '@/components/layout/navigation'

interface AIGeneratorSettings {
  interfaceLanguage: Language
  generationLanguage: Language
  autoDetectLanguage: boolean
  model: 'gpt-4' | 'gpt-3.5-turbo'
  temperature: number
  maxTokens: number
  testCount: number
  detailLevel: 'basic' | 'standard' | 'comprehensive' | 'expert'
  focusAreas: string[]
  selectedTemplate: string
  streamingMode: boolean
  requestTimeout: number
}

export default function AIGenerator() {
  const [inputText, setInputText] = useState('')
  const [generatedTests, setGeneratedTests] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'saving' | 'saved' | 'error' }>({})
  
  // Streaming hook
  const streaming = useAIStreaming()
  const [settings, setSettings] = useState<AIGeneratorSettings | null>(null)
  const [currentLang, setCurrentLang] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)
  const [languageService, setLanguageService] = useState<BilingualService | null>(null)
  
  // GitHub integration state
  const [selectedRepository, setSelectedRepository] = useState<GitHubRepository | null>(null)
  const [selectedIssues, setSelectedIssues] = useState<GitHubIssue[]>([])
  const [inputMode, setInputMode] = useState<'text' | 'github'>('text')
  
  // Local test count override
  const [localTestCount, setLocalTestCount] = useState<number | null>(null)
  
  // Prompt preview state
  const [showPromptPreview, setShowPromptPreview] = useState(false)
  const [promptPreview, setPromptPreview] = useState<{ system: string, user: string } | null>(null)

  const loadSettings = useCallback((service?: BilingualService, initialLang?: Language) => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('ai_generator_settings')
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          setSettings(parsed)
          console.log('[Settings] Loaded from localStorage:', {
            streamingMode: parsed.streamingMode,
            testCount: parsed.testCount,
            selectedTemplate: parsed.selectedTemplate
          })
          
          // Update language service if needed and available
          if (service && parsed.interfaceLanguage && parsed.interfaceLanguage !== (initialLang || currentLang)) {
            service.setLanguage(parsed.interfaceLanguage)
            setCurrentLang(parsed.interfaceLanguage)
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
        // Continue with default settings
      }
    }
  }, []) // Remove all dependencies to prevent loops

  useEffect(() => {
    // Initialize services only after mount to prevent hydration issues
    try {
      const service = BilingualService.getInstance()
      setLanguageService(service)
      service.initializeLanguage()
      const initialLang = service.getCurrentLanguage()
      setCurrentLang(initialLang)
      loadSettings(service, initialLang) // Pass service and lang directly to avoid dependency loop
      setMounted(true)
    } catch (error) {
      console.error('Failed to initialize language service:', error)
      setMounted(true) // Still set mounted to prevent hydration issues
    }
  }, []) // Remove loadSettings from dependencies

  // Listen for focus events to reload settings when returning from settings page
  useEffect(() => {
    const handleFocus = () => {
      if (mounted && languageService) {
        console.log('[Settings] Page focused - reloading settings')
        loadSettings(languageService, currentLang)
      }
    }

    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [mounted, languageService, loadSettings, currentLang])

  const handleGenerate = async () => {
    // Validate input based on mode
    if (inputMode === 'text') {
      if (!inputText.trim()) {
        const errorMsg = currentLang === 'en' 
          ? 'Please enter some text to generate test cases from'
          : 'Vennligst skriv inn tekst for å generere testtilfeller fra'
        setError(errorMsg)
        return
      }
    } else if (inputMode === 'github') {
      if (!selectedRepository) {
        const errorMsg = currentLang === 'en' 
          ? 'Please select a GitHub repository'
          : 'Vennligst velg et GitHub repository'
        setError(errorMsg)
        return
      }
      if (selectedIssues.length === 0) {
        const errorMsg = currentLang === 'en' 
          ? 'Please select at least one GitHub issue'
          : 'Vennligst velg minst ett GitHub issue'
        setError(errorMsg)
        return
      }
    }

    setError(null)
    setGeneratedTests([])
    streaming.reset()

    // Prepare input data based on mode
    let inputData: any
    if (inputMode === 'text') {
      inputData = {
        text: inputText.trim(),
        options: generationOptions
      }
    } else {
      inputData = {
        issues: selectedIssues.map(issue => ({
          number: issue.number,
          title: issue.title,
          body: issue.body,
          labels: issue.labels.map(label => label.name),
          repository: selectedRepository?.full_name
        })),
        repository: selectedRepository?.full_name,
        options: generationOptions
      }
    }

    // Check if streaming mode is enabled
    const useStreaming = settings?.streamingMode ?? false
    const apiEndpoint = inputMode === 'text' ? '/api/ai/generate-from-text' : '/api/ai/generate-from-issues'

    if (useStreaming) {
      // Use streaming mode for both text and GitHub issues
      if (inputMode === 'text') {
        await streaming.startStreaming({
          text: inputText.trim(),
          options: generationOptions,
          onTestCase: (testCase, index) => {
            console.log('[Streaming Debug] Received test case:', index, testCase)
            // Test cases are accumulated in the streaming hook
          },
          onProgress: (progress, status) => {
            console.log('[Streaming Debug] Progress:', progress, status)
          },
          onComplete: (testCases) => {
            console.log('[Streaming Debug] Complete:', testCases.length, 'test cases')
            setGeneratedTests(testCases)
          },
          onError: (error) => {
            console.error('[Streaming Debug] Error:', error)
            setError(error)
          }
        })
      } else if (inputMode === 'github') {
        // GitHub Issues streaming mode
        await streaming.startGitHubIssuesStreaming({
          issues: selectedIssues.map(issue => ({
            number: issue.number,
            title: issue.title,
            body: issue.body,
            labels: issue.labels.map(label => label.name),
            repository: selectedRepository?.full_name
          })),
          repository: selectedRepository?.full_name,
          options: generationOptions,
          onTestCase: (testCase, index) => {
            console.log('[GitHub Streaming Debug] Received test case:', index, testCase)
          },
          onProgress: (progress, status) => {
            console.log('[GitHub Streaming Debug] Progress:', progress, status)
          },
          onComplete: (testCases) => {
            console.log('[GitHub Streaming Debug] Complete:', testCases.length, 'test cases')
            setGeneratedTests(testCases)
          },
          onError: (error) => {
            console.error('[GitHub Streaming Debug] Error:', error)
            setError(error)
          }
        })
      }
    } else {
      // Use batch mode for both text and GitHub issues
      setLoading(true)

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(inputData)
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate test cases')
        }

        console.log('[UI Debug] API Response data:', data)
        console.log('[UI Debug] Test Cases received:', data.testCases)
        if (data.testCases && data.testCases.length > 0) {
          console.log('[UI Debug] First test case steps:', data.testCases[0].steps)
        }

        setGeneratedTests(data.testCases)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate test cases')
      } finally {
        setLoading(false)
      }
    }
  }

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const copyAllTests = async () => {
    const allTestsText = generatedTests.map(test => 
      formatTestCaseAsText(test)
    ).join('\n\n---\n\n')
    
    await copyToClipboard(allTestsText)
  }

  const copyTestCase = async (testCase: TestCase) => {
    const testText = formatTestCaseAsText(testCase)
    await copyToClipboard(testText)
  }

  const formatTestCaseAsText = (testCase: TestCase): string => {
    const stepsText = testCase.steps.map(step => 
      `${step.stepNumber}. **Action:** ${step.action}\n   **Expected:** ${step.expectedResult}`
    ).join('\n')

    return `# ${testCase.title}

**Description:** ${testCase.description}
**Priority:** ${testCase.priority}
**Tags:** ${testCase.tags.join(', ')}

## Preconditions
${testCase.preconditions || 'None specified'}

## Test Steps
${stepsText}

## Expected Final Result
${testCase.expectedResult}`
  }

  const saveTestCase = async (testCase: TestCase) => {
    setSaveStatus(prev => ({ ...prev, [testCase.id]: 'saving' }))
    
    try {
      const response = await fetch('/api/testcases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase)
      })

      if (!response.ok) {
        throw new Error('Failed to save test case')
      }

      setSaveStatus(prev => ({ ...prev, [testCase.id]: 'saved' }))
      
      // Reset save status after 2 seconds
      setTimeout(() => {
        setSaveStatus(prev => {
          const newStatus = { ...prev }
          delete newStatus[testCase.id]
          return newStatus
        })
      }, 2000)
    } catch (error) {
      console.error('Failed to save test case:', error)
      setSaveStatus(prev => ({ ...prev, [testCase.id]: 'error' }))
    }
  }

  const downloadAsMarkdown = () => {
    const allTestsText = generatedTests.map(test => 
      formatTestCaseAsText(test)
    ).join('\n\n---\n\n')
    
    const blob = new Blob([allTestsText], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-generated-test-cases.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getSaveButtonContent = (testCaseId: string) => {
    const status = saveStatus[testCaseId]
    switch (status) {
      case 'saving':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
            {currentLang === 'en' ? 'Saving...' : 'Lagrer...'}
          </>
        )
      case 'saved':
        return (
          <>
            <CheckCircle className="h-4 w-4 mr-1" />
            {currentLang === 'en' ? 'Saved' : 'Lagret'}
          </>
        )
      case 'error':
        return (
          <>
            <AlertCircle className="h-4 w-4 mr-1" />
            {currentLang === 'en' ? 'Error' : 'Feil'}
          </>
        )
      default:
        return (
          <>
            <Save className="h-4 w-4 mr-1" />
            {currentLang === 'en' ? 'Save to Library' : 'Lagre til Bibliotek'}
          </>
        )
    }
  }

  const t = useCallback((key: string) => languageService?.t(key) || key, [languageService])

  const generatePromptPreview = useCallback(() => {
    if (!settings) return
    
    let systemPrompt = ''
    let userPrompt = ''
    
    if (inputMode === 'text') {
      // Text input mode
      const templateId = settings.selectedTemplate || 'default'
      const language = settings.generationLanguage || 'en'
      const testCount = localTestCount ?? settings.testCount ?? 5
      
      // Get system prompt from template service
      systemPrompt = `You are a QA expert that creates comprehensive manual test cases for software features. 
Generate structured test cases that are clear, actionable, and thorough.
Return your response as valid JSON matching this exact structure:
[
  {
    "title": "string",
    "description": "string", 
    "preconditions": "string",
    "steps": [
      {
        "stepNumber": number,
        "action": "string",
        "expectedResult": "string"
      }
    ],
    "expectedResult": "string",
    "priority": "low" | "medium" | "high" | "critical",
    "tags": ["string"]
  }
]`
      
      userPrompt = `Based on the following description, generate ${testCount} comprehensive manual test cases.

Description: "${inputText.trim()}"

Generate ${testCount} test cases that focus on functional testing, edge cases, and user experience validation.

RESPOND ONLY IN JSON FORMAT - START WITH [ AND END WITH ]`
      
    } else if (inputMode === 'github' && selectedRepository && selectedIssues.length > 0) {
      // GitHub issues mode
      systemPrompt = `You are a QA expert that creates comprehensive manual test cases for software features. 
Generate structured test cases that are clear, actionable, and thorough.
Return your response as valid JSON matching this exact structure:
{
  "title": "string",
  "description": "string", 
  "preconditions": "string",
  "steps": [
    {
      "stepNumber": number,
      "action": "string",
      "expectedResult": "string"
    }
  ],
  "expectedResult": "string",
  "priority": "low" | "medium" | "high" | "critical",
  "tags": ["string"]
}`

      const issuesText = selectedIssues.map(issue => `
**Issue Title:** ${issue.title}

**Issue Description:**
${issue.body || 'No description provided'}

**Labels:** ${issue.labels.map(l => l.name).join(', ') || 'None'}

**Issue URL:** ${issue.html_url}
`).join('\n---\n')
      
      userPrompt = `Create a comprehensive manual test case for the following GitHub issue:

${issuesText}

Please generate a detailed manual test case that covers:
1. Clear preconditions and setup steps
2. Step-by-step testing procedures 
3. Expected results for each step
4. Overall expected outcome
5. Appropriate priority level based on the issue
6. Relevant tags for categorization

Focus on creating actionable test steps that a manual tester can follow to verify the feature or bug fix described in the issue. Include edge cases and negative testing scenarios where appropriate.

Consider the issue type (bug, feature, enhancement) when determining test coverage and priority.`
    }
    
    setPromptPreview({ system: systemPrompt, user: userPrompt })
    setShowPromptPreview(true)
  }, [settings, inputMode, inputText, selectedRepository, selectedIssues, localTestCount])

  const generationOptions = useMemo(() => {
    return settings ? {
      templateId: settings.selectedTemplate,
      language: settings.generationLanguage,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      testCount: localTestCount ?? settings.testCount
    } : undefined
  }, [settings, localTestCount])

  const updateTemplate = useCallback((templateId: string) => {
    if (!settings) return
    
    const updatedSettings = { ...settings, selectedTemplate: templateId }
    setSettings(updatedSettings)
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ai_generator_settings', JSON.stringify(updatedSettings))
      } catch (error) {
        console.error('Failed to save template setting:', error)
      }
    }
  }, [settings])

  const updateTestCount = useCallback((testCount: number) => {
    if (!settings) return
    
    // Update local override
    setLocalTestCount(testCount)
    
    // Also update the settings object for persistence
    const updatedSettings = { ...settings, testCount }
    setSettings(updatedSettings)
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ai_generator_settings', JSON.stringify(updatedSettings))
        console.log(`Test count updated to ${testCount}`)
      } catch (error) {
        console.error('Failed to save test count setting:', error)
      }
    }
  }, [settings])

  const getTemplateDisplayName = useCallback((templateId: string): string => {
    const templateNames = {
      'default': currentLang === 'en' ? 'General Test Cases' : 'Generelle Testtilfeller',
      'web_application': currentLang === 'en' ? 'Web Application' : 'Nettapplikasjon',
      'api_testing': currentLang === 'en' ? 'API Testing' : 'API Testing',
      'security_testing': currentLang === 'en' ? 'Security Testing' : 'Sikkerhetstesting',
      'mobile_testing': currentLang === 'en' ? 'Mobile Testing' : 'Mobil Testing'
    }
    return templateNames[templateId] || templateId
  }, [currentLang])

  // Prevent hydration issues by not rendering until mounted
  if (!mounted) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            AI Test Case Generator
          </h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            <h1 className="text-3xl font-bold">
              {currentLang === 'en' ? 'AI Test Case Generator' : 'AI Testtilfelle Generator'}
            </h1>
          </div>
          <div className="flex-1 flex justify-end">
            <Link href="/ai-generator/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                {currentLang === 'en' ? 'Settings' : 'Innstillinger'}
              </Button>
            </Link>
          </div>
        </div>
        
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {currentLang === 'en' 
            ? 'Transform any requirement, feature description, or user story into comprehensive test cases using AI'
            : 'Transformer ethvert krav, funksjonsbeskrivelse eller brukerhistorie til omfattende testtilfeller ved hjelp av AI'
          }
        </p>
        
        {settings && (
          <div className="space-y-2">
            <Link href="/ai-generator/settings" className="inline-block">
              <div className="inline-flex items-center gap-4 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-muted px-4 py-2 rounded-lg hover:bg-muted/80">
                <span>
                  {currentLang === 'en' ? 'Template:' : 'Mal:'} <span className="font-medium">{settings.selectedTemplate}</span>
                </span>
                <span>
                  {currentLang === 'en' ? 'Language:' : 'Språk:'} <span className="font-medium">{settings.generationLanguage.toUpperCase()}</span>
                </span>
                <span>
                  {currentLang === 'en' ? 'Count:' : 'Antall:'} <span className="font-medium">{settings.testCount}</span>
                </span>
                <span className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${settings.streamingMode ? 'bg-blue-500' : 'bg-green-500'}`} />
                  <span className="font-medium">
                    {settings.streamingMode 
                      ? (currentLang === 'en' ? 'Streaming' : 'Streaming')
                      : (currentLang === 'en' ? 'Batch' : 'Batch')
                    }
                  </span>
                </span>
                <ExternalLink className="h-3 w-3 opacity-50" />
              </div>
            </Link>
            <p className="text-xs text-muted-foreground">
              {currentLang === 'en' 
                ? 'Click to configure templates, prompts, and generation settings'
                : 'Klikk for å konfigurere maler, prompts og genereringsinnstillinger'
              }
              {settings && (
                <span className="block mt-1">
                  {settings.streamingMode 
                    ? (currentLang === 'en' 
                        ? 'Using Streaming Mode - see progress in real-time'
                        : 'Bruker Streaming Modus - se fremdrift i sanntid'
                      )
                    : (currentLang === 'en' 
                        ? 'Using Batch Mode - faster for small generations'
                        : 'Bruker Batch Modus - raskere for små genereringer'
                      )
                  }
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Quick Template Switcher */}
      {settings && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">
                  {currentLang === 'en' ? 'Template:' : 'Mal:'}
                </span>
                <Select value={settings.selectedTemplate} onValueChange={updateTemplate}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">
                      📝 {getTemplateDisplayName('default')}
                    </SelectItem>
                    <SelectItem value="web_application">
                      🌐 {getTemplateDisplayName('web_application')}
                    </SelectItem>
                    <SelectItem value="api_testing">
                      🔌 {getTemplateDisplayName('api_testing')}
                    </SelectItem>
                    <SelectItem value="security_testing">
                      🔒 {getTemplateDisplayName('security_testing')}
                    </SelectItem>
                    <SelectItem value="mobile_testing">
                      📱 {getTemplateDisplayName('mobile_testing')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-medium">
                  {currentLang === 'en' ? 'Test Count:' : 'Antall Tester:'}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => updateTestCount(Math.max(1, (localTestCount ?? settings?.testCount ?? 5) - 1))}
                    disabled={!settings}
                  >
                    -
                  </Button>
                  <div className="w-12 h-8 flex items-center justify-center bg-muted rounded text-sm font-medium">
                    {localTestCount ?? settings?.testCount ?? 5}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => updateTestCount(Math.min(20, (localTestCount ?? settings?.testCount ?? 5) + 1))}
                    disabled={!settings}
                  >
                    +
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {currentLang === 'en' 
                  ? 'Choose the template and number of test cases that best match your testing needs'
                  : 'Velg malen og antall testtilfeller som best matcher dine testingbehov'
                }
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Section with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            {currentLang === 'en' ? 'Input Source' : 'Input Kilde'}
          </CardTitle>
          <CardDescription>
            {currentLang === 'en'
              ? 'Choose how you want to provide input for test case generation'
              : 'Velg hvordan du vil oppgi input for testtilfelle-generering'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={inputMode} onValueChange={(value: any) => setInputMode(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {currentLang === 'en' ? 'Text Input' : 'Tekst Input'}
              </TabsTrigger>
              <TabsTrigger value="github" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                {currentLang === 'en' ? 'GitHub Issues' : 'GitHub Issues'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder={currentLang === 'en' 
                    ? "Example: Users should be able to reset their password when they forget it..."
                    : "Eksempel: Brukere skal kunne tilbakestille passordet når de glemmer det..."
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[120px] resize-none"
                  disabled={loading || streaming.isStreaming}
                />
                <div className="text-xs text-muted-foreground">
                  💡 {currentLang === 'en'
                    ? 'Try: User stories, feature descriptions, requirements, or any functionality you want to test'
                    : 'Prøv: Brukerhistorier, funksjonsbeskrivelser, krav, eller hvilken som helst funksjonalitet du vil teste'
                  }
                </div>
              </div>
            </TabsContent>

            <TabsContent value="github" className="space-y-4">
              <div className="space-y-4">
                <RepositoryPicker
                  selectedRepository={selectedRepository}
                  onRepositorySelect={setSelectedRepository}
                  disabled={loading || streaming.isStreaming}
                />
                
                <IssueSelector
                  repository={selectedRepository}
                  selectedIssues={selectedIssues}
                  onIssueSelectionChange={setSelectedIssues}
                  disabled={loading || streaming.isStreaming}
                />
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {currentLang === 'en' ? 'Error' : 'Feil'}
                </span>
              </div>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleGenerate}
              disabled={
                loading || streaming.isStreaming || 
                (inputMode === 'text' && !inputText.trim()) ||
                (inputMode === 'github' && (!selectedRepository || selectedIssues.length === 0))
              }
              className="flex-1"
              size="lg"
            >
              {(loading || streaming.isStreaming) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {streaming.isStreaming 
                    ? (currentLang === 'en' ? 'Streaming Test Cases...' : 'Streamer Testtilfeller...')
                    : (currentLang === 'en' ? 'Generating Test Cases...' : 'Genererer Testtilfeller...')
                  }
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {(() => {
                    const testCount = localTestCount ?? settings?.testCount ?? 5
                    if (inputMode === 'github') {
                      return currentLang === 'en' 
                        ? `Generate ${testCount} Test Cases from ${selectedIssues.length} Issues`
                        : `Generer ${testCount} Testtilfeller fra ${selectedIssues.length} Issues`
                    } else {
                      if (settings?.streamingMode) {
                        return currentLang === 'en' 
                          ? `Stream Generate ${testCount} Test Cases`
                          : `Stream Generer ${testCount} Testtilfeller`
                      } else {
                        return currentLang === 'en' 
                          ? `Generate ${testCount} Test Cases`
                          : `Generer ${testCount} Testtilfeller`
                      }
                    }
                  })()}
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={generatePromptPreview}
              disabled={
                loading || streaming.isStreaming || 
                (inputMode === 'text' && !inputText.trim()) ||
                (inputMode === 'github' && (!selectedRepository || selectedIssues.length === 0))
              }
              size="lg"
            >
              <Eye className="h-4 w-4 mr-2" />
              {currentLang === 'en' ? 'Preview Prompt' : 'Forhåndsvis Prompt'}
            </Button>
          </div>

          {/* Progress Indicator for Streaming Mode */}
          {streaming.isStreaming && (
            <ProgressIndicator
              progress={streaming.progress}
              status={streaming.status}
              currentStep={streaming.currentStep}
              totalSteps={streaming.totalExpected}
              currentStepIndex={streaming.currentIndex}
              estimatedTimeRemaining={streaming.estimatedTimeRemaining}
              canCancel={true}
              onCancel={streaming.cancelStreaming}
              language={currentLang}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {(generatedTests.length > 0 || streaming.testCases.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  {streaming.isStreaming 
                    ? `Generating Test Cases (${streaming.testCases.length}/${streaming.totalExpected})`
                    : `Generated Test Cases (${generatedTests.length})`
                  }
                </CardTitle>
                <CardDescription className="space-y-1">
                  <div>AI-generated test cases ready for review and use</div>
                  {inputMode === 'github' && selectedRepository && (
                    <div className="flex items-center gap-2 text-xs">
                      <GitBranch className="h-3 w-3" />
                      <span>Generated from {selectedRepository.full_name}</span>
                      {selectedIssues.length > 0 && (
                        <Badge variant="outline" className="h-4 text-xs px-1">
                          {selectedIssues.length} issues
                        </Badge>
                      )}
                    </div>
                  )}
                  {inputMode === 'text' && (
                    <div className="flex items-center gap-2 text-xs">
                      <FileText className="h-3 w-3" />
                      <span>Generated from custom text input</span>
                    </div>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyAllTests}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy All
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsMarkdown}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(streaming.isStreaming ? streaming.testCases : generatedTests).map((testCase, index) => (
                <div 
                  key={testCase.id} 
                  className={`border rounded-lg p-4 space-y-4 transition-all duration-300 ${
                    streaming.isStreaming && index === streaming.testCases.length - 1
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                      : ''
                  }`}
                >
                  {/* Test Case Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">{testCase.title}</h3>
                      <p className="text-muted-foreground">{testCase.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getPriorityColor(testCase.priority)} text-white text-xs`}>
                          {testCase.priority}
                        </Badge>
                        {testCase.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyTestCase(testCase)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveTestCase(testCase)}
                        disabled={saveStatus[testCase.id] === 'saving'}
                        className={saveStatus[testCase.id] === 'saved' ? 'text-green-600' : ''}
                      >
                        {getSaveButtonContent(testCase.id)}
                      </Button>
                    </div>
                  </div>

                  {/* Preconditions */}
                  {testCase.preconditions && (
                    <div>
                      <h4 className="font-medium mb-1">Preconditions</h4>
                      <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                        {testCase.preconditions}
                      </p>
                    </div>
                  )}

                  {/* Test Steps */}
                  <div>
                    <h4 className="font-medium mb-2">Test Steps</h4>
                    <div className="space-y-2">
                      {testCase.steps && testCase.steps.length > 0 ? (
                        testCase.steps.map((step, stepIndex) => {
                          console.log(`[UI Debug] Step ${stepIndex}:`, {
                            step: step,
                            action: step.action,
                            actionType: typeof step.action,
                            expectedResult: step.expectedResult,
                            expectedResultType: typeof step.expectedResult,
                            allFields: Object.keys(step)
                          })
                          return (
                            <div key={step.id || stepIndex} className="flex gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300">
                                {step.stepNumber || stepIndex + 1}
                              </span>
                              <div className="flex-1 space-y-1">
                                <p className="text-sm">
                                  <strong>Action:</strong> {step.action || step.step || step.description || 'No action specified'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  <strong>Expected:</strong> {step.expectedResult || step.expected || 'No expected result specified'}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-sm text-muted-foreground">No test steps available</div>
                      )}
                    </div>
                  </div>

                  {/* Expected Result */}
                  <div>
                    <h4 className="font-medium mb-1">Expected Final Result</h4>
                    <p className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950/20 p-2 rounded">
                      {testCase.expectedResult}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && generatedTests.length === 0 && !error && (
        <Card className="p-12 text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Ready to Generate Test Cases</h3>
          <p className="text-muted-foreground">
            Enter a feature description, user story, or requirement above to get started
          </p>
        </Card>
      )}

      {/* Prompt Preview Dialog */}
      <Dialog open={showPromptPreview} onOpenChange={setShowPromptPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {currentLang === 'en' ? 'AI Prompt Preview' : 'AI Prompt Forhåndsvisning'}
            </DialogTitle>
            <DialogDescription>
              {currentLang === 'en' 
                ? 'This shows the exact prompts that will be sent to the AI to generate your test cases. Review for completeness and accuracy.'
                : 'Dette viser de nøyaktige promptene som vil bli sendt til AI for å generere testtilfellene dine. Gjennomgå for fullstendighet og nøyaktighet.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {promptPreview && (
            <div className="space-y-6">
              {/* System Prompt Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {currentLang === 'en' ? 'System Prompt' : 'System Prompt'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {currentLang === 'en' ? 'Instructions for AI behavior and response format' : 'Instruksjoner for AI-oppførsel og responsformat'}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-4 overflow-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">{promptPreview.system}</pre>
                </div>
              </div>

              {/* User Prompt Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {currentLang === 'en' ? 'User Prompt' : 'Bruker Prompt'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {currentLang === 'en' ? 'Your input and specific requirements' : 'Din input og spesifikke krav'}
                  </span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 overflow-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">{promptPreview.user}</pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`System Prompt:\n${promptPreview.system}\n\nUser Prompt:\n${promptPreview.user}`)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {currentLang === 'en' ? 'Copy Prompts' : 'Kopier Prompts'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPromptPreview(false)}
                >
                  {currentLang === 'en' ? 'Close' : 'Lukk'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </div>
  )
}