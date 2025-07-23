'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  FileText, Code, Package, Clock, GitMerge, Database, Shield, 
  AlertTriangle, CheckCircle, Copy, AlertCircle, Sparkles,
  ChevronRight, Terminal, FileCode
} from 'lucide-react'

interface EnhancedResultsProps {
  results: any // Using any for flexibility with enhanced results
}

export function EnhancedScanResults({ results }: EnhancedResultsProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedTests, setExpandedTests] = useState<string[]>([])
  
  // Debug log to see what data we're receiving
  console.log('Enhanced Results - Code Analysis:', results.codeAnalysis)

  const toggleTestExpansion = (testId: string) => {
    setExpandedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'api', label: 'API Endpoints', icon: GitMerge, count: results.codeAnalysis?.apiEndpoints?.length },
            { id: 'database', label: 'Database', icon: Database, count: results.codeAnalysis?.databaseOperations?.length },
            { id: 'security', label: 'Security', icon: Shield, count: results.codeAnalysis?.securityConcerns?.length },
            { id: 'risks', label: 'Risk Assessment', icon: AlertTriangle },
            { id: 'tests', label: 'Test Cases', icon: CheckCircle, count: results.testSuggestions?.length }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count && tab.count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {tab.count}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Repository Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{results.overview.totalFiles}</p>
                  <p className="text-sm text-muted-foreground">Files</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Code className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{results.overview.totalLines.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Lines of Code</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{results.technologies.frameworks.length}</p>
                  <p className="text-sm text-muted-foreground">Frameworks</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{(results.scanDuration / 1000).toFixed(1)}s</p>
                  <p className="text-sm text-muted-foreground">Scan Time</p>
                </CardContent>
              </Card>
            </div>

            {/* AI Analysis Summary */}
            {results.codeAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <span>AI Analysis Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {results.codeAnalysis.architecturePattern && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Architecture</p>
                        <p className="mt-1">{results.codeAnalysis.architecturePattern}</p>
                      </div>
                    )}
                    {results.codeAnalysis.riskAssessment && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Overall Risk</p>
                        <Badge 
                          variant={
                            results.codeAnalysis.riskAssessment.overallRisk === 'critical' ? 'destructive' :
                            results.codeAnalysis.riskAssessment.overallRisk === 'high' ? 'default' :
                            'secondary'
                          }
                          className="mt-1"
                        >
                          {results.codeAnalysis.riskAssessment.overallRisk.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Documentation Quality</p>
                      <div className="mt-2">
                        <Progress 
                          value={
                            results.codeAnalysis.documentationQuality !== undefined 
                              ? results.codeAnalysis.documentationQuality 
                              : results.metrics?.documentationCoverage || 0
                          } 
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {results.codeAnalysis.documentationQuality !== undefined 
                            ? `${results.codeAnalysis.documentationQuality}%`
                            : results.metrics?.documentationCoverage !== undefined
                              ? `${results.metrics.documentationCoverage}%`
                              : 'Not analyzed'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Code Complexity</p>
                      <div className="mt-2">
                        <Progress 
                          value={
                            results.codeAnalysis.codeComplexity?.overall !== undefined
                              ? results.codeAnalysis.codeComplexity.overall
                              : results.metrics?.complexityScore || 0
                          } 
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {results.codeAnalysis.codeComplexity?.overall !== undefined
                            ? `${results.codeAnalysis.codeComplexity.overall}/100`
                            : results.metrics?.complexityScore !== undefined
                              ? `${results.metrics.complexityScore}/100`
                              : 'Not analyzed'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* API Endpoints Tab */}
        {activeTab === 'api' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
                <CardDescription>
                  Discovered API endpoints that need testing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.codeAnalysis?.apiEndpoints?.length > 0 ? (
                  <div className="space-y-3">
                    {results.codeAnalysis.apiEndpoints.map((endpoint: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="font-mono">
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm">{endpoint.path}</code>
                          {endpoint.authentication && (
                            <Shield className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={
                              endpoint.testPriority === 'critical' ? 'destructive' :
                              endpoint.testPriority === 'high' ? 'default' :
                              'secondary'
                            }
                          >
                            {endpoint.testPriority}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(`${endpoint.method} ${endpoint.path}`)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No API endpoints detected</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Database Tab */}
        {activeTab === 'database' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Operations</CardTitle>
                <CardDescription>
                  Database queries and mutations found in the codebase
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.codeAnalysis?.databaseOperations?.length > 0 ? (
                  <div className="space-y-3">
                    {results.codeAnalysis.databaseOperations.map((op: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{op.type.toUpperCase()}</Badge>
                              <span className="font-medium">{op.entity}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{op.description}</p>
                          </div>
                          <Badge 
                            variant={
                              op.complexity === 'complex' ? 'destructive' :
                              op.complexity === 'moderate' ? 'default' :
                              'secondary'
                            }
                          >
                            {op.complexity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No database operations detected</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Analysis</CardTitle>
                <CardDescription>
                  Potential security vulnerabilities and concerns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.codeAnalysis?.securityConcerns?.length > 0 ? (
                  <div className="space-y-3">
                    {results.codeAnalysis.securityConcerns.map((concern: any, index: number) => (
                      <Alert 
                        key={index} 
                        variant={concern.severity === 'critical' || concern.severity === 'high' ? 'destructive' : 'default'}
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{concern.type}</span>
                              <Badge 
                                variant={
                                  concern.severity === 'critical' ? 'destructive' :
                                  concern.severity === 'high' ? 'default' :
                                  'secondary'
                                }
                              >
                                {concern.severity}
                              </Badge>
                            </div>
                            <p>{concern.description}</p>
                            {concern.file && (
                              <p className="text-xs text-muted-foreground">File: {concern.file}</p>
                            )}
                            {concern.recommendation && (
                              <div className="mt-2 p-2 bg-muted rounded">
                                <p className="text-sm font-medium">Recommendation:</p>
                                <p className="text-sm">{concern.recommendation}</p>
                              </div>
                            )}
                            {concern.testCase && (
                              <div className="mt-2 p-2 bg-muted rounded">
                                <p className="text-sm font-medium">Test Case:</p>
                                <p className="text-sm font-mono">{concern.testCase}</p>
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      No critical security concerns detected
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Risk Assessment Tab */}
        {activeTab === 'risks' && (
          <div className="space-y-4">
            {results.codeAnalysis?.riskAssessment && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-medium">Overall Risk Level</span>
                      <Badge 
                        variant={
                          results.codeAnalysis.riskAssessment.overallRisk === 'critical' ? 'destructive' :
                          results.codeAnalysis.riskAssessment.overallRisk === 'high' ? 'default' :
                          'secondary'
                        }
                        className="text-lg px-3 py-1"
                      >
                        {results.codeAnalysis.riskAssessment.overallRisk.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {results.codeAnalysis.riskAssessment.riskFactors?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Risk Factors</h4>
                        {results.codeAnalysis.riskAssessment.riskFactors.map((factor: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{factor.area}</span>
                              <Badge 
                                variant={
                                  factor.risk === 'critical' ? 'destructive' :
                                  factor.risk === 'high' ? 'default' :
                                  'secondary'
                                }
                              >
                                {factor.risk}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{factor.reason}</p>
                            <p className="text-sm mt-2">
                              <span className="font-medium">Mitigation: </span>
                              {factor.mitigation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {results.codeAnalysis.riskAssessment.testingPriorities?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Testing Priorities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {results.codeAnalysis.riskAssessment.testingPriorities
                          .sort((a: any, b: any) => b.priority - a.priority)
                          .map((priority: any, index: number) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{priority.area}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-muted-foreground">Priority</span>
                                  <Badge>{priority.priority}/10</Badge>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{priority.reason}</p>
                              {priority.suggestedTests?.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium mb-1">Suggested Tests:</p>
                                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                                    {priority.suggestedTests.map((test: string, i: number) => (
                                      <li key={i}>{test}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* Test Cases Tab */}
        {activeTab === 'tests' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generated Test Cases</CardTitle>
                <CardDescription>
                  AI-generated test cases based on code analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.testSuggestions?.length > 0 ? (
                  <div className="space-y-4">
                    {results.testSuggestions.map((test: any) => (
                      <div key={test.id} className="border rounded-lg overflow-hidden">
                        <div 
                          className="p-4 cursor-pointer hover:bg-accent"
                          onClick={() => toggleTestExpansion(test.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <ChevronRight 
                                  className={`h-4 w-4 transition-transform ${
                                    expandedTests.includes(test.id) ? 'rotate-90' : ''
                                  }`}
                                />
                                <h4 className="font-medium">{test.title}</h4>
                                {test.aiGenerated && (
                                  <Badge variant="secondary" className="ml-2">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    AI Generated
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {test.description}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Badge 
                                variant={
                                  test.priority === 'critical' ? 'destructive' :
                                  test.priority === 'high' ? 'default' :
                                  'secondary'
                                }
                              >
                                {test.priority}
                              </Badge>
                              {test.category && (
                                <Badge variant="outline">{test.category}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {expandedTests.includes(test.id) && (
                          <div className="border-t p-4 bg-muted/50 space-y-4">
                            {/* API Endpoint Info */}
                            {(test.apiEndpoint || test.httpMethod) && (
                              <div>
                                <p className="text-sm font-medium mb-2">API Details</p>
                                <div className="flex items-center space-x-2">
                                  {test.httpMethod && (
                                    <Badge variant="outline">{test.httpMethod}</Badge>
                                  )}
                                  {test.apiEndpoint && (
                                    <code className="text-sm">{test.apiEndpoint}</code>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Test Steps */}
                            {test.testSteps && test.testSteps.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Test Steps</p>
                                <ol className="list-decimal list-inside space-y-2">
                                  {test.testSteps.map((step: any) => (
                                    <li key={step.id} className="text-sm">
                                      <span className="font-medium">{step.action}</span>
                                      {step.expectedResult && (
                                        <span className="block ml-6 text-muted-foreground">
                                          Expected: {step.expectedResult}
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {/* Request/Response */}
                            {test.requestBody && (
                              <div>
                                <p className="text-sm font-medium mb-2">Request Body</p>
                                <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(test.requestBody, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {test.expectedResponse && (
                              <div>
                                <p className="text-sm font-medium mb-2">Expected Response</p>
                                <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(test.expectedResponse, null, 2)}
                                </pre>
                              </div>
                            )}

                            {/* Test Code */}
                            {test.testCode && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium">Test Code</p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(test.testCode)}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </Button>
                                </div>
                                <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
                                  <code>{test.testCode}</code>
                                </pre>
                              </div>
                            )}

                            {/* Test Data */}
                            {test.testData && test.testData.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Test Data</p>
                                <div className="space-y-1">
                                  {test.testData.map((data: any, index: number) => (
                                    <div key={index} className="flex items-center space-x-2 text-sm">
                                      <code className="font-medium">{data.name}:</code>
                                      <code className="text-muted-foreground">{data.value}</code>
                                      {data.description && (
                                        <span className="text-xs text-muted-foreground">({data.description})</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Additional Info */}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Estimated Effort: {test.estimatedEffort}
                              </span>
                              {test.riskLevel && (
                                <Badge variant="outline">
                                  Risk: {test.riskLevel}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No test cases generated</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}