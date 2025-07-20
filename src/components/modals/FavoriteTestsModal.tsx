'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Heart, Play, TestTube2, Loader2, Star, Clock } from 'lucide-react'
import { TestCase } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface FavoriteTestsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FavoriteTestsModal({ open, onOpenChange }: FavoriteTestsModalProps) {
  const router = useRouter()
  const [favoriteTests, setFavoriteTests] = useState<TestCase[]>([])
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    if (open) {
      loadFavoriteTests()
    }
  }, [open])

  const loadFavoriteTests = async () => {
    setLoading(true)
    try {
      // For now, we'll simulate favorites by getting recent test cases
      // In a real implementation, this would fetch user's favorited tests
      const response = await fetch('/api/testcases?limit=10')
      if (response.ok) {
        const testCases = await response.json()
        // Simulate some tests being favorites
        const mockFavorites = testCases.slice(0, 5).map((tc: TestCase) => ({
          ...tc,
          isFavorite: true,
          lastRun: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }))
        setFavoriteTests(mockFavorites)
      }
    } catch (error) {
      console.error('Failed to load favorite tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTestSelection = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    )
  }

  const selectAllTests = () => {
    if (selectedTests.length === favoriteTests.length) {
      setSelectedTests([])
    } else {
      setSelectedTests(favoriteTests.map(test => test.id))
    }
  }

  const runSelectedTests = async () => {
    if (selectedTests.length === 0) return
    
    setExecuting(true)
    try {
      // Navigate to batch test runner with selected test IDs
      const testIds = selectedTests.join(',')
      onOpenChange(false)
      router.push(`/testcases/batch/run?ids=${testIds}`)
    } catch (error) {
      console.error('Failed to run tests:', error)
    } finally {
      setExecuting(false)
    }
  }

  const runSingleTest = (testId: string) => {
    onOpenChange(false)
    router.push(`/testcases/${testId}/run`)
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

  const formatLastRun = (lastRun: string) => {
    const date = new Date(lastRun)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Favorite Test Cases
          </DialogTitle>
          <DialogDescription>
            Execute your most frequently used test cases individually or in batch
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading favorite tests...</span>
            </div>
          ) : favoriteTests.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Favorite Tests Yet</h3>
              <p className="text-muted-foreground mb-4">
                Star your frequently used test cases to see them here
              </p>
              <Button onClick={() => {
                onOpenChange(false)
                router.push('/testcases')
              }}>
                Browse Test Cases
              </Button>
            </div>
          ) : (
            <>
              {/* Bulk Actions */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedTests.length === favoriteTests.length}
                    onCheckedChange={selectAllTests}
                  />
                  <span className="text-sm font-medium">
                    {selectedTests.length === 0 
                      ? 'Select all tests' 
                      : `${selectedTests.length} of ${favoriteTests.length} selected`
                    }
                  </span>
                </div>
                <Button 
                  onClick={runSelectedTests}
                  disabled={selectedTests.length === 0 || executing}
                  size="sm"
                >
                  {executing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Selected ({selectedTests.length})
                    </>
                  )}
                </Button>
              </div>

              {/* Test Cases Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favoriteTests.map((test) => (
                  <Card key={test.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Checkbox
                            checked={selectedTests.includes(test.id)}
                            onCheckedChange={() => toggleTestSelection(test.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base leading-tight truncate">
                              {test.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getPriorityColor(test.priority)} text-white border-0`}
                              >
                                {test.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatLastRun(test.lastRun)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Heart className="h-4 w-4 text-red-500 fill-red-500 flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {test.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {test.steps.length} steps
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => runSingleTest(test.id)}
                        >
                          <TestTube2 className="h-3 w-3 mr-1" />
                          Run
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        {favoriteTests.length > 0 && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => {
              onOpenChange(false)
              router.push('/testcases')
            }}>
              Manage Favorites
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}