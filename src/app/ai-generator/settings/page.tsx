'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EnhancedSlider } from '@/components/ui/enhanced-slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  Globe,
  Settings,
  BookTemplate,
  Sliders,
  Save,
  RotateCcw,
  CheckCircle,
  Eye,
  Code,
  Copy,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BilingualService, Language } from '@/lib/language-service'
import { PromptTemplateService } from '@/lib/prompt-templates'
import { SettingsSync } from '@/lib/settings-sync'

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

const defaultSettings: AIGeneratorSettings = {
  interfaceLanguage: 'en',
  generationLanguage: 'en',
  autoDetectLanguage: true,
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 3000,
  testCount: 5,
  detailLevel: 'standard',
  focusAreas: ['happy_path', 'edge_cases', 'error_handling'],
  selectedTemplate: 'default',
  streamingMode: false,
  requestTimeout: 120
}

export default function AIGeneratorSettings() {
  const router = useRouter()
  const [settings, setSettings] = useState<AIGeneratorSettings>(defaultSettings)
  const [currentLang, setCurrentLang] = useState<Language>('en')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [mounted, setMounted] = useState(false)
  const [languageService, setLanguageService] = useState<BilingualService | null>(null)
  const [templateService, setTemplateService] = useState<PromptTemplateService | null>(null)
  const [showPromptDetails, setShowPromptDetails] = useState(false)
  const [sampleInput, setSampleInput] = useState('')
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [streamingToggled, setStreamingToggled] = useState(false)

  const loadSettings = useCallback((service?: BilingualService, initialLang?: Language) => {
    if (typeof window !== 'undefined') {
      try {
        // Use the new sync utility to load settings
        const syncedSettings = SettingsSync.getAIGeneratorSettings()
        setSettings(syncedSettings)
        
        // Update language service if available and interface language changed
        if (service && syncedSettings.interfaceLanguage && syncedSettings.interfaceLanguage !== (initialLang || currentLang)) {
          service.setLanguage(syncedSettings.interfaceLanguage)
          setCurrentLang(syncedSettings.interfaceLanguage)
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
      const langService = BilingualService.getInstance()
      const templService = PromptTemplateService.getInstance()
      
      setLanguageService(langService)
      setTemplateService(templService)
      
      langService.initializeLanguage()
      const initialLang = langService.getCurrentLanguage()
      setCurrentLang(initialLang)
      loadSettings(langService, initialLang) // Pass service and lang directly to avoid dependency loop
      setMounted(true)
    } catch (error) {
      console.error('Failed to initialize services:', error)
      setMounted(true) // Still set mounted to prevent hydration issues
    }
  }, []) // Remove loadSettings from dependencies

  const saveSettings = () => {
    setSaveStatus('saving')
    if (typeof window !== 'undefined') {
      try {
        // Use the new sync utility to save settings
        SettingsSync.saveAIGeneratorSettings(settings)
        
        // Update language service if available
        if (languageService) {
          languageService.setLanguage(settings.interfaceLanguage)
          setCurrentLang(settings.interfaceLanguage)
        }
      } catch (error) {
        console.error('Failed to save settings:', error)
      }
    }
    
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 500)
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ai_generator_settings')
    }
    if (languageService) {
      languageService.setLanguage('en')
      setCurrentLang('en')
    }
  }

  const updateSetting = <K extends keyof AIGeneratorSettings>(
    key: K, 
    value: AIGeneratorSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    // Auto-save for streaming mode to make it work immediately
    if (key === 'streamingMode' && typeof window !== 'undefined') {
      try {
        localStorage.setItem('ai_generator_settings', JSON.stringify(newSettings))
        console.log(`Streaming mode ${value ? 'enabled' : 'disabled'} - settings auto-saved`)
        
        // Show feedback
        setStreamingToggled(true)
        setTimeout(() => setStreamingToggled(false), 2000)
      } catch (error) {
        console.error('Failed to auto-save streaming mode setting:', error)
      }
    }
  }

  const toggleFocusArea = (area: string) => {
    setSettings(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }))
  }

  const t = useCallback((key: string) => languageService?.t(key) || key, [languageService])

  const getTemplateDisplayName = useCallback((templateId: string): string => {
    if (!templateService) return templateId
    const template = templateService.getTemplate(templateId)
    return template ? template.name[currentLang] : templateId
  }, [templateService, currentLang])

  const getTemplateDescription = useCallback((templateId: string): string => {
    if (!templateService) return ''
    const template = templateService.getTemplate(templateId)
    return template ? template.description[currentLang] : ''
  }, [templateService, currentLang])

  const getTemplateShortDescription = useCallback((templateId: string): string => {
    const descriptions = {
      'default': {
        en: 'General purpose testing',
        no: 'Generell testing'
      },
      'web_application': {
        en: 'Web UI and functionality',
        no: 'Web UI og funksjonalitet'
      },
      'api_testing': {
        en: 'REST API endpoints',
        no: 'REST API endepunkter'
      },
      'security_testing': {
        en: 'Security and authentication',
        no: 'Sikkerhet og autentisering'
      },
      'mobile_testing': {
        en: 'Mobile apps and devices',
        no: 'Mobile apper og enheter'
      }
    }
    return descriptions[templateId]?.[currentLang] || ''
  }, [currentLang])

  const getTemplateFocusAreas = useCallback((templateId: string): string => {
    if (!templateService) return ''
    const template = templateService.getTemplate(templateId)
    if (!template) return ''
    
    const areaLabels = template.focusAreas.map(area => t(area)).join(', ')
    return areaLabels
  }, [templateService, t])

  const getSystemPromptPreview = useCallback((templateId: string): string => {
    if (!templateService) return ''
    return templateService.getSystemPromptPreview(templateId, currentLang, 400)
  }, [templateService, currentLang])

  const getUserPromptFormat = useCallback((templateId: string): string => {
    if (!templateService) return ''
    return templateService.getUserPromptFormat(templateId, currentLang)
  }, [templateService, currentLang])

  const getCompletePromptExample = useCallback((templateId: string, input?: string): string => {
    if (!templateService) return ''
    return templateService.getCompletePromptExample(templateId, currentLang, input)
  }, [templateService, currentLang])

  const getPromptStatistics = useCallback((templateId: string, input: string = '') => {
    if (!templateService) return null
    return templateService.getPromptStatistics(templateId, currentLang, input)
  }, [templateService, currentLang])

  const getPromptGuidelines = useCallback(() => {
    if (!templateService) return null
    return templateService.getPromptGuidelines(currentLang)
  }, [templateService, currentLang])

  const copyPromptToClipboard = useCallback(async (templateId: string) => {
    if (!templateService) return
    
    const prompt = getCompletePromptExample(templateId, sampleInput || undefined)
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedPrompt(true)
      setTimeout(() => setCopiedPrompt(false), 2000)
    } catch (error) {
      console.error('Failed to copy prompt:', error)
    }
  }, [templateService, sampleInput, getCompletePromptExample])

  // Prevent hydration issues by not rendering until mounted
  if (!mounted) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/ai-generator')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">AI Generator Settings</h1>
              <p className="text-muted-foreground mt-1">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/ai-generator" className="hover:text-foreground flex items-center gap-1">
          <Sparkles className="h-4 w-4" />
          {currentLang === 'en' ? 'AI Generator' : 'AI Generator'}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">
          {currentLang === 'en' ? 'Settings' : 'Innstillinger'}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/ai-generator')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentLang === 'en' ? 'Back to Generator' : 'Tilbake til Generator'}
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              {t('ai_generator_settings')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentLang === 'en' 
                ? 'Configure templates, prompts, and AI generation behavior'
                : 'Konfigurer maler, prompts og AI-genereringsoppførsel'
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {currentLang === 'en' ? 'General Settings' : 'Generelle Innstillinger'}
            </Link>
          </Button>
          <Button variant="outline" onClick={resetSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('reset')}
          </Button>
          <Button onClick={saveSettings} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saved' ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saveStatus === 'saving' ? 
              (currentLang === 'en' ? 'Saving...' : 'Lagrer...') : 
              saveStatus === 'saved' ? 
                (currentLang === 'en' ? 'Saved!' : 'Lagret!') : 
                t('save')
            }
          </Button>
        </div>
      </div>

      {/* Language Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('language')}
          </CardTitle>
          <CardDescription>
            {currentLang === 'en' 
              ? 'Select interface and generation language preferences'
              : 'Velg grensesnitt og språkpreferanser for generering'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('interface_language')}</Label>
              <Select 
                value={settings.interfaceLanguage} 
                onValueChange={(value: Language) => updateSetting('interfaceLanguage', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="no">🇳🇴 Norsk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('generation_language')}</Label>
              <Select 
                value={settings.generationLanguage} 
                onValueChange={(value: Language) => updateSetting('generationLanguage', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="no">🇳🇴 Norsk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              checked={settings.autoDetectLanguage}
              onCheckedChange={(checked) => updateSetting('autoDetectLanguage', checked)}
            />
            <Label>{t('auto_detect')}</Label>
          </div>
        </CardContent>
      </Card>

      {/* Main Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('general')}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <BookTemplate className="h-4 w-4" />
            {t('templates')}
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            {t('advanced')}
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('general')} {currentLang === 'en' ? 'Settings' : 'Innstillinger'}</CardTitle>
              <CardDescription>
                {currentLang === 'en' 
                  ? 'Core AI generation settings and behavior'
                  : 'Hovedinnstillinger for AI-generering og oppførsel'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AI Model Selection */}
              <div className="space-y-2">
                <Label>{t('ai_model')}</Label>
                <Select 
                  value={settings.model} 
                  onValueChange={(value: 'gpt-4' | 'gpt-3.5-turbo') => updateSetting('model', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Temperature */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>{t('temperature')}</Label>
                  <span className="text-sm text-muted-foreground">{settings.temperature}</span>
                </div>
                <div className="space-y-3">
                  <EnhancedSlider
                    value={[settings.temperature]}
                    onValueChange={([value]) => updateSetting('temperature', value)}
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    className="w-full"
                    showTicks={true}
                    tickCount={10}
                    trackHeight="md"
                    thumbSize="md"
                  />
                  <div className="flex justify-between text-sm font-medium text-muted-foreground px-1">
                    <span>{currentLang === 'en' ? 'Consistent' : 'Konsistent'}</span>
                    <span>{currentLang === 'en' ? 'Creative' : 'Kreativ'}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Test Count */}
              <div className="space-y-2">
                <Label>{t('test_count')}</Label>
                <Select 
                  value={settings.testCount.toString()} 
                  onValueChange={(value) => updateSetting('testCount', parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Detail Level */}
              <div className="space-y-3">
                <Label>{t('detail_level')}</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['basic', 'standard', 'comprehensive', 'expert'].map((level) => (
                    <Button
                      key={level}
                      variant={settings.detailLevel === level ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('detailLevel', level as 'basic' | 'standard' | 'comprehensive' | 'expert')}
                      className="w-full"
                    >
                      {t(level)}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Focus Areas */}
              <div className="space-y-3">
                <Label>{t('focus_areas')}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'happy_path',
                    'edge_cases', 
                    'error_handling',
                    'security_testing',
                    'performance_testing',
                    'accessibility'
                  ].map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Switch
                        checked={settings.focusAreas.includes(area)}
                        onCheckedChange={() => toggleFocusArea(area)}
                      />
                      <Label className="text-sm">{t(area)}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('templates')}</CardTitle>
              <CardDescription>
                {currentLang === 'en' 
                  ? 'Manage prompt templates for different testing scenarios'
                  : 'Administrer promptmaler for ulike testscenarier'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Template */}
              <div className="space-y-2">
                <Label>
                  {currentLang === 'en' ? 'Active Template' : 'Aktiv Mal'}
                </Label>
                <Select 
                  value={settings.selectedTemplate} 
                  onValueChange={(value) => updateSetting('selectedTemplate', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">
                      {currentLang === 'en' ? 'General Test Cases' : 'Generelle Testtilfeller'}
                    </SelectItem>
                    <SelectItem value="web_application">
                      {currentLang === 'en' ? 'Web Application Testing' : 'Nettapplikasjon Testing'}
                    </SelectItem>
                    <SelectItem value="api_testing">
                      {currentLang === 'en' ? 'API Testing' : 'API Testing'}
                    </SelectItem>
                    <SelectItem value="security_testing">
                      {currentLang === 'en' ? 'Security Testing' : 'Sikkerhetstesting'}
                    </SelectItem>
                    <SelectItem value="mobile_testing">
                      {currentLang === 'en' ? 'Mobile Testing' : 'Mobil Testing'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Template Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {currentLang === 'en' ? 'Template Preview' : 'Malforhåndsvisning'}
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPromptDetails(!showPromptDetails)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {currentLang === 'en' ? 'View Prompts' : 'Vis Prompts'}
                    {showPromptDetails ? (
                      <ChevronUp className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    )}
                  </Button>
                </div>
                
                <div className="bg-muted p-4 rounded-lg text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">
                        {currentLang === 'en' ? 'Category:' : 'Kategori:'}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {getTemplateDisplayName(settings.selectedTemplate)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">
                        {currentLang === 'en' ? 'Description:' : 'Beskrivelse:'}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {getTemplateDescription(settings.selectedTemplate)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">
                        {currentLang === 'en' ? 'Focus Areas:' : 'Fokusområder:'}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {getTemplateFocusAreas(settings.selectedTemplate)}
                      </span>
                    </div>
                    
                    {/* Prompt Statistics */}
                    {(() => {
                      const stats = getPromptStatistics(settings.selectedTemplate, sampleInput)
                      return stats ? (
                        <div>
                          <span className="font-medium">
                            {currentLang === 'en' ? 'Estimated Tokens:' : 'Estimerte Tokens:'}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            ~{stats.estimatedTokens} tokens
                          </span>
                        </div>
                      ) : null
                    })()}
                  </div>
                </div>

                {/* Detailed Prompt Information */}
                {showPromptDetails && (
                  <div className="space-y-4">
                    {/* System Prompt Preview */}
                    <div className="space-y-2">
                      <h5 className="font-medium flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        {currentLang === 'en' ? 'System Prompt' : 'System Prompt'}
                      </h5>
                      <div className="bg-gray-50 dark:bg-gray-800 border rounded-lg p-3 text-sm font-mono">
                        <div className="max-h-32 overflow-y-auto whitespace-pre-wrap">
                          {getSystemPromptPreview(settings.selectedTemplate)}
                        </div>
                      </div>
                    </div>

                    {/* User Prompt Format */}
                    <div className="space-y-2">
                      <h5 className="font-medium">
                        {currentLang === 'en' ? 'User Input Format' : 'Brukerinput Format'}
                      </h5>
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                        <span className="font-mono text-blue-800 dark:text-blue-200">
                          {getUserPromptFormat(settings.selectedTemplate)}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Example */}
                    <div className="space-y-2">
                      <h5 className="font-medium">
                        {currentLang === 'en' ? 'Try It Out' : 'Prøv det ut'}
                      </h5>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-muted-foreground">
                            {currentLang === 'en' 
                              ? 'Enter sample text to see how it gets formatted:'
                              : 'Skriv inn eksempeltekst for å se hvordan den formateres:'
                            }
                          </label>
                          <textarea
                            value={sampleInput}
                            onChange={(e) => setSampleInput(e.target.value)}
                            placeholder={currentLang === 'en' 
                              ? 'Enter your test requirement here...'
                              : 'Skriv inn ditt testkrav her...'
                            }
                            className="w-full mt-1 p-2 border rounded-md text-sm min-h-[60px] resize-none"
                          />
                        </div>
                        
                        {sampleInput && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {currentLang === 'en' ? 'Complete Prompt:' : 'Fullstendig Prompt:'}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyPromptToClipboard(settings.selectedTemplate)}
                                disabled={copiedPrompt}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                {copiedPrompt 
                                  ? (currentLang === 'en' ? 'Copied!' : 'Kopiert!')
                                  : (currentLang === 'en' ? 'Copy' : 'Kopier')
                                }
                              </Button>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 border rounded-lg p-3 text-xs font-mono max-h-40 overflow-y-auto">
                              <pre className="whitespace-pre-wrap">
                                {getCompletePromptExample(settings.selectedTemplate, sampleInput)}
                              </pre>
                            </div>
                            
                            {(() => {
                              const stats = getPromptStatistics(settings.selectedTemplate, sampleInput)
                              return stats ? (
                                <div className="text-xs text-muted-foreground">
                                  {currentLang === 'en' 
                                    ? `${stats.totalLength} characters, ~${stats.estimatedTokens} tokens`
                                    : `${stats.totalLength} tegn, ~${stats.estimatedTokens} tokens`
                                  }
                                </div>
                              ) : null
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Template Categories */}
              <div className="space-y-3">
                <h4 className="font-medium">
                  {currentLang === 'en' ? 'Available Templates' : 'Tilgjengelige Maler'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: 'default', icon: '📝' },
                    { id: 'web_application', icon: '🌐' },
                    { id: 'api_testing', icon: '🔌' },
                    { id: 'security_testing', icon: '🔒' },
                    { id: 'mobile_testing', icon: '📱' }
                  ].map((template) => (
                    <Button
                      key={template.id}
                      variant={settings.selectedTemplate === template.id ? 'default' : 'outline'}
                      onClick={() => updateSetting('selectedTemplate', template.id)}
                      className="justify-start p-3 h-auto"
                    >
                      <span className="text-lg mr-3">{template.icon}</span>
                      <div className="text-left">
                        <div className="font-medium">
                          {getTemplateDisplayName(template.id)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getTemplateShortDescription(template.id)}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Prompt Guidelines */}
              {(() => {
                const guidelines = getPromptGuidelines()
                return guidelines ? (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      {guidelines.title}
                    </h4>
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <ul className="space-y-2 text-sm">
                        {guidelines.guidelines.map((guideline, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold mt-0.5">•</span>
                            <span>{guideline}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null
              })()}

              <Separator />

              {/* Custom Templates (Future Enhancement) */}
              <div className="space-y-3">
                <h4 className="font-medium">
                  {currentLang === 'en' ? 'Custom Templates' : 'Tilpassede Maler'}
                </h4>
                <div className="text-center py-4 text-muted-foreground">
                  <div className="text-sm">
                    {currentLang === 'en' 
                      ? 'Custom template creation and management coming in future updates'
                      : 'Opprettelse og administrasjon av tilpassede maler kommer i fremtidige oppdateringer'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('advanced')} {currentLang === 'en' ? 'Settings' : 'Innstillinger'}</CardTitle>
              <CardDescription>
                {currentLang === 'en' 
                  ? 'Advanced configuration options for power users'
                  : 'Avanserte konfigurasjonsalternativer for avanserte brukere'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Max Tokens */}
              <div className="space-y-4">
                <Label>
                  {currentLang === 'en' ? 'Max Tokens' : 'Maks Tokens'}
                  <span className="text-sm text-muted-foreground ml-2">({settings.maxTokens})</span>
                </Label>
                <div className="space-y-3">
                  <EnhancedSlider
                    value={[settings.maxTokens]}
                    onValueChange={([value]) => updateSetting('maxTokens', value)}
                    min={1000}
                    max={4000}
                    step={250}
                    className="w-full"
                    showTicks={true}
                    tickCount={7}
                    trackHeight="md"
                    thumbSize="md"
                  />
                  <div className="flex justify-between text-sm font-medium text-muted-foreground px-1">
                    <span>1000 (Focused)</span>
                    <span>4000 (Comprehensive)</span>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
                    {currentLang === 'en' 
                      ? 'Higher values allow for more detailed test cases but cost more tokens'
                      : 'Høyere verdier tillater mer detaljerte testtilfeller, men koster flere tokens'
                    }
                  </p>
                </div>
              </div>

              <Separator />

              {/* Streaming Mode Toggle */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium flex items-center gap-2">
                        {currentLang === 'en' ? 'Generation Mode' : 'Genereringsmodus'}
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">
                          {settings.streamingMode ? 'ON' : 'OFF'}
                        </span>
                        {streamingToggled && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full animate-pulse">
                            {currentLang === 'en' ? 'Saved!' : 'Lagret!'}
                          </span>
                        )}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {currentLang === 'en' 
                          ? 'Choose how test cases are generated and displayed'
                          : 'Velg hvordan testtilfeller genereres og vises'
                        }
                        {streamingToggled && (
                          <span className="block text-xs mt-1 text-green-600 dark:text-green-400">
                            {currentLang === 'en' 
                              ? 'Setting saved automatically - ready to use immediately!'
                              : 'Innstilling lagret automatisk - klar til bruk umiddelbart!'
                            }
                          </span>
                        )}
                      </p>
                    </div>
                    <Switch
                      checked={settings.streamingMode}
                      onCheckedChange={(checked) => {
                        console.log('[UI] Streaming toggle clicked:', checked)
                        updateSetting('streamingMode', checked)
                      }}
                      className="scale-110"
                    />
                  </div>
                  
                  <div className="pl-4 space-y-2">
                    <div className={`p-3 rounded-lg border transition-colors ${settings.streamingMode 
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                      : 'bg-muted border-muted-foreground/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${settings.streamingMode ? 'bg-blue-500' : 'bg-muted-foreground'}`} />
                        <span className="font-medium text-sm">
                          {currentLang === 'en' ? 'Streaming Mode' : 'Streaming Modus'} {settings.streamingMode && '(Active)'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {currentLang === 'en' 
                          ? 'See test cases as they\'re generated with real-time progress. Includes time estimates and cancellation.'
                          : 'Se testtilfeller mens de genereres med sanntids fremdrift. Inkluderer tidsestimering og avbrytelse.'
                        }
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded-lg border transition-colors ${!settings.streamingMode 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                      : 'bg-muted border-muted-foreground/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${!settings.streamingMode ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                        <span className="font-medium text-sm">
                          {currentLang === 'en' ? 'Batch Mode' : 'Batch Modus'} {!settings.streamingMode && '(Active)'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {currentLang === 'en' 
                          ? 'Traditional loading - all test cases appear when generation is complete. Faster for small batches.'
                          : 'Tradisjonell lasting - alle testtilfeller vises når generering er ferdig. Raskere for små serier.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Request Timeout */}
              <div className="space-y-4">
                <Label>
                  {currentLang === 'en' ? 'Request Timeout' : 'Forespørsel Timeout'}
                  <span className="text-sm text-muted-foreground ml-2">({settings.requestTimeout}s)</span>
                </Label>
                <div className="space-y-3">
                  <EnhancedSlider
                    value={[settings.requestTimeout]}
                    onValueChange={([value]) => updateSetting('requestTimeout', value)}
                    min={30}
                    max={300}
                    step={30}
                    className="w-full"
                    showTicks={true}
                    tickCount={10}
                    trackHeight="md"
                    thumbSize="md"
                  />
                  <div className="flex justify-between text-sm font-medium text-muted-foreground px-1">
                    <span>30s (Fast)</span>
                    <span>300s (Patient)</span>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
                    {currentLang === 'en' 
                      ? 'Maximum time to wait for AI generation before timeout'
                      : 'Maksimal tid å vente på AI-generering før timeout'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}