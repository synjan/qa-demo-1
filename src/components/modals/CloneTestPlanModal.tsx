'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Copy, FolderOpen, Search, Loader2, CheckCircle, Calendar } from 'lucide-react'
import { TestPlan } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface CloneTestPlanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CloneTestPlanModal({ open, onOpenChange }: CloneTestPlanModalProps) {
  const router = useRouter()
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<TestPlan | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [cloning, setCloning] = useState(false)
  const [cloned, setCloned] = useState(false)
  
  // Clone form data
  const [cloneName, setCloneName] = useState('')
  const [cloneDescription, setCloneDescription] = useState('')

  useEffect(() => {
    if (open) {
      loadTestPlans()
    }
  }, [open])

  useEffect(() => {
    if (selectedPlan) {
      setCloneName(`${selectedPlan.name} (Copy)`)
      setCloneDescription(selectedPlan.description)
    }
  }, [selectedPlan])

  const loadTestPlans = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/testplans')
      if (response.ok) {
        const plans = await response.json()
        setTestPlans(plans)
      }
    } catch (error) {
      console.error('Failed to load test plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPlans = testPlans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const cloneTestPlan = async () => {
    if (!selectedPlan || !cloneName.trim()) return

    setCloning(true)
    try {
      const cloneData = {
        name: cloneName.trim(),
        description: cloneDescription.trim(),
        sourceId: selectedPlan.id,
        testCases: selectedPlan.testCases
      }

      const response = await fetch('/api/testplans/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cloneData)
      })

      if (response.ok) {
        const result = await response.json()
        setCloned(true)
        
        // Auto-close and navigate after a short delay
        setTimeout(() => {
          onOpenChange(false)
          router.push(`/testplans/${result.id}`)
        }, 2000)
      } else {
        throw new Error('Failed to clone test plan')
      }
    } catch (error) {
      console.error('Clone error:', error)
    } finally {
      setCloning(false)
    }
  }

  const resetModal = () => {
    setSelectedPlan(null)
    setSearchTerm('')
    setCloneName('')
    setCloneDescription('')
    setCloned(false)
  }

  const closeModal = () => {
    resetModal()
    onOpenChange(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (cloned) {
    return (
      <Dialog open={open} onOpenChange={closeModal}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Test Plan Cloned Successfully!</h3>
            <p className="text-muted-foreground mb-4">
              &quot;{cloneName}&quot; has been created and you&apos;ll be redirected to it shortly.
            </p>
            <Button onClick={closeModal} variant="outline">
              Stay Here
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-orange-500" />
            Clone Test Plan
          </DialogTitle>
          <DialogDescription>
            Select an existing test plan to duplicate as a starting point for your new plan
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Test Plan Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="search" className="text-base font-medium">
                Select Test Plan to Clone
              </Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search test plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading test plans...</span>
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {searchTerm ? 'No plans found' : 'No Test Plans'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search term' : 'Create your first test plan to clone it'}
                  </p>
                </div>
              ) : (
                filteredPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-colors ${
                      selectedPlan?.id === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base leading-tight truncate">
                            {plan.name}
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {plan.description}
                          </CardDescription>
                        </div>
                        {selectedPlan?.id === plan.id && (
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="outline">
                          {plan.testCases.length} test cases
                        </Badge>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(plan.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Clone Configuration */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Clone Configuration</Label>
              {!selectedPlan ? (
                <div className="mt-4 text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <Copy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Select a test plan to configure cloning options
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {/* Source Plan Preview */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Source Plan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Name:</span>
                        <span className="font-medium truncate ml-2">{selectedPlan.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Test Cases:</span>
                        <span className="font-medium">{selectedPlan.testCases.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Created:</span>
                        <span className="font-medium">{formatDate(selectedPlan.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Clone Form */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="clone-name">New Plan Name</Label>
                      <Input
                        id="clone-name"
                        value={cloneName}
                        onChange={(e) => setCloneName(e.target.value)}
                        placeholder="Enter name for the cloned plan"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="clone-description">Description</Label>
                      <Textarea
                        id="clone-description"
                        value={cloneDescription}
                        onChange={(e) => setCloneDescription(e.target.value)}
                        placeholder="Describe the purpose of this test plan"
                        className="mt-2"
                        rows={3}
                      />
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">What will be cloned?</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>All test cases from the source plan</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Plan structure and organization</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>New timestamps and fresh execution history</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            onClick={cloneTestPlan}
            disabled={!selectedPlan || !cloneName.trim() || cloning}
          >
            {cloning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cloning...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Clone Test Plan
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}