'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GitBranch, Loader2, AlertCircle, Clock, FileText, Code, Package, Sparkles, Shield, Database, GitMerge, AlertTriangle, CheckCircle } from 'lucide-react'
import { ScanSession, ScanResults, GitHubRepository } from '@/lib/types'
import { RepositoryPicker } from '@/components/github/repository-picker'
import { EnhancedScanResults } from '@/components/scanner/enhanced-results'

export default function ScannerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [selectedRepository, setSelectedRepository] = useState<GitHubRepository | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [currentScan, setCurrentScan] = useState<ScanSession | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanSession[]>([])
  const [error, setError] = useState<string | null>(null)
  const [useAI, setUseAI] = useState(true)
  const [aiModel, setAIModel] = useState('gpt-4-turbo-preview')

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      const hasToken = typeof window !== 'undefined' && localStorage.getItem('github_pat')
      if (!hasToken) {
        router.push('/auth/signin')
      }
    }
  }, [session, status, router])

  // Load scan history on mount
  useEffect(() => {
    if (session || localStorage.getItem('github_pat')) {
      loadScanHistory()
    }
  }, [session])

  // Poll for scan updates
  useEffect(() => {
    if (!currentScan || currentScan.status === 'completed' || currentScan.status === 'failed') {
      return
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/scanner?id=${currentScan.id}`, {
          headers: getAuthHeaders()
        })
        
        if (response.ok) {
          const updatedScan = await response.json()
          setCurrentScan(updatedScan)
          
          if (updatedScan.status === 'completed' || updatedScan.status === 'failed') {
            setIsScanning(false)
            loadScanHistory()
          }
        }
      } catch (error) {
        console.error('Failed to update scan status:', error)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [currentScan])

  const getAuthHeaders = () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    // Get token from session or localStorage
    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`
    } else if (typeof window !== 'undefined') {
      const pat = localStorage.getItem('github_pat')
      if (pat) {
        headers.Authorization = `Bearer ${pat}`
      }
    }
    
    return headers
  }

  const loadScanHistory = async () => {
    try {
      const response = await fetch('/api/scanner', {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setScanHistory(data.scans || [])
      }
    } catch (error) {
      console.error('Failed to load scan history:', error)
    }
  }

  const handleStartScan = async () => {
    const urlToScan = selectedRepository?.html_url || repositoryUrl.trim()
    
    if (!urlToScan) {
      setError('Please select a repository or enter a repository URL')
      return
    }

    setError(null)
    setIsScanning(true)
    
    try {
      const response = await fetch('/api/scanner', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ repositoryUrl: urlToScan, useAI, aiModel })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start scan')
      }
      
      const data = await response.json()
      
      // Create initial scan session
      const scanSession: ScanSession = {
        id: data.scanId,
        repositoryUrl: urlToScan,
        repository: urlToScan.split('/').slice(-2).join('/'),
        status: 'pending',
        progress: 0,
        startedAt: new Date()
      }
      
      setCurrentScan(scanSession)
      setRepositoryUrl('')
      setSelectedRepository(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scan')
      setIsScanning(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-foreground mb-6">Repository Scanner</h1>
          
          {/* Scanner Input */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Scan a Repository</CardTitle>
              <CardDescription>
                Enter a GitHub repository URL to analyze its code structure and generate test suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Repository Picker */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Repository
                  </label>
                  <RepositoryPicker
                    selectedRepository={selectedRepository}
                    onRepositorySelect={setSelectedRepository}
                    disabled={isScanning}
                  />
                </div>

                {/* AI Toggle */}
                <div className={`relative p-4 rounded-lg border-2 transition-all ${
                  useAI 
                    ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/50' 
                    : 'bg-muted/50 border-border'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full transition-all ${
                      useAI ? 'bg-purple-500/20' : 'bg-muted'
                    }`}>
                      <Sparkles className={`h-5 w-5 transition-all ${
                        useAI ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="ai-mode" className="cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-base">AI-Powered Analysis</div>
                            <div className="text-sm text-muted-foreground">
                              Get intelligent code insights, security analysis, and detailed test suggestions
                            </div>
                          </div>
                          <Switch
                            id="ai-mode"
                            checked={useAI}
                            onCheckedChange={setUseAI}
                            disabled={isScanning}
                            className="ml-4 data-[state=checked]:bg-purple-600"
                          />
                        </div>
                      </Label>
                    </div>
                  </div>
                  {useAI && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-300">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Architecture Detection
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-300">
                          Security Analysis
                        </Badge>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-300">
                          Smart Test Generation
                        </Badge>
                      </div>
                      
                      {/* Model Selector */}
                      <div>
                        <Label htmlFor="ai-model" className="text-xs font-medium text-muted-foreground mb-1 block">
                          AI Model
                        </Label>
                        <Select
                          value={aiModel}
                          onValueChange={setAIModel}
                          disabled={isScanning}
                        >
                          <SelectTrigger id="ai-model" className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4-turbo-preview">
                              <div className="flex items-center justify-between w-full">
                                <span>GPT-4 Turbo</span>
                                <span className="text-xs text-muted-foreground ml-2">Most capable</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="gpt-4">
                              <div className="flex items-center justify-between w-full">
                                <span>GPT-4</span>
                                <span className="text-xs text-muted-foreground ml-2">High quality</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="gpt-3.5-turbo">
                              <div className="flex items-center justify-between w-full">
                                <span>GPT-3.5 Turbo</span>
                                <span className="text-xs text-muted-foreground ml-2">Fast & affordable</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* OR Divider */}
                <div className="flex items-center space-x-2">
                  <div className="flex-1 border-t border-border"></div>
                  <span className="text-sm text-muted-foreground px-2">OR</span>
                  <div className="flex-1 border-t border-border"></div>
                </div>

                {/* Manual URL Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Enter Repository URL
                  </label>
                  <div className="flex gap-4">
                    <Input
                      placeholder="https://github.com/owner/repo or owner/repo"
                      value={repositoryUrl}
                      onChange={(e) => setRepositoryUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleStartScan()}
                      disabled={isScanning}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleStartScan} 
                      disabled={isScanning || (!selectedRepository && !repositoryUrl.trim())}
                      className={useAI ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {useAI ? 'AI Analyzing...' : 'Scanning...'}
                        </>
                      ) : (
                        <>
                          {useAI ? (
                            <Sparkles className="mr-2 h-4 w-4" />
                          ) : (
                            <GitBranch className="mr-2 h-4 w-4" />
                          )}
                          {useAI ? 'Start AI Scan' : 'Start Scan'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Current Scan Progress */}
          {currentScan && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Scanning {currentScan.repository}</span>
                  <Badge variant={
                    currentScan.status === 'completed' ? 'default' :
                    currentScan.status === 'failed' ? 'destructive' :
                    'secondary'
                  }>
                    {currentScan.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentScan.status !== 'completed' && currentScan.status !== 'failed' && (
                  <div className="space-y-3">
                    <Progress value={currentScan.progress} className="w-full" />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {currentScan.currentStep || 'Initializing...'}
                      </p>
                      <span className="text-sm font-medium">{currentScan.progress}%</span>
                    </div>
                    
                    {/* AI Processing Indicator */}
                    {currentScan.currentStep?.toLowerCase().includes('ai') && (
                      <div className="flex items-center space-x-2 p-3 bg-purple-500/10 rounded-lg">
                        <div className="relative">
                          <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-25"></div>
                          <Sparkles className="h-5 w-5 text-purple-600 relative z-10" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            AI Processing
                          </p>
                          <p className="text-xs text-muted-foreground">
                            This may take a moment depending on the model and repository size
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {currentScan.status === 'completed' && currentScan.results && (
                  <EnhancedScanResults results={currentScan.results} />
                )}
                
                {currentScan.status === 'failed' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {currentScan.error || 'Scan failed. Please try again.'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Scan History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
            </CardHeader>
            <CardContent>
              {scanHistory.length === 0 ? (
                <p className="text-muted-foreground">No scans yet. Start by scanning a repository above.</p>
              ) : (
                <div className="space-y-4">
                  {scanHistory.map((scan) => (
                    <div 
                      key={scan.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => setCurrentScan(scan)}
                    >
                      <div>
                        <h4 className="font-medium">{scan.repository}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(scan.startedAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={
                        scan.status === 'completed' ? 'default' :
                        scan.status === 'failed' ? 'destructive' :
                        'secondary'
                      }>
                        {scan.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}