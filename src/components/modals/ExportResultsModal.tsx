'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, FileText, Calendar, Filter, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface ExportResultsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ExportOptions {
  format: 'csv' | 'json' | 'pdf'
  dateRange: 'all' | 'week' | 'month' | 'quarter' | 'custom'
  includeDetails: boolean
  includeSteps: boolean
  includeNotes: boolean
  filterByStatus: string[]
  filterByPriority: string[]
}

export function ExportResultsModal({ open, onOpenChange }: ExportResultsModalProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: 'month',
    includeDetails: true,
    includeSteps: false,
    includeNotes: false,
    filterByStatus: [],
    filterByPriority: []
  })
  const [exporting, setExporting] = useState(false)

  const formatOptions = [
    { value: 'csv', label: 'CSV (Excel Compatible)', description: 'Comma-separated values for spreadsheet analysis' },
    { value: 'json', label: 'JSON', description: 'Machine-readable format for integrations' },
    { value: 'pdf', label: 'PDF Report', description: 'Formatted report for presentations' }
  ]

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const statusOptions = ['pass', 'fail', 'blocked', 'skipped']
  const priorityOptions = ['critical', 'high', 'medium', 'low']

  const updateOptions = (key: keyof ExportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const toggleArrayOption = (key: 'filterByStatus' | 'filterByPriority', value: string) => {
    setOptions(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }))
  }

  const exportResults = async () => {
    setExporting(true)
    try {
      const queryParams = new URLSearchParams({
        format: options.format,
        dateRange: options.dateRange,
        includeDetails: options.includeDetails.toString(),
        includeSteps: options.includeSteps.toString(),
        includeNotes: options.includeNotes.toString(),
        status: options.filterByStatus.join(','),
        priority: options.filterByPriority.join(',')
      })

      const response = await fetch(`/api/testresults/export?${queryParams}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')
        a.download = `test-results-${timestamp}.${options.format}`
        
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        onOpenChange(false)
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      // Could show error notification here
    } finally {
      setExporting(false)
    }
  }

  const getEstimatedRecords = () => {
    // This would normally calculate based on actual data
    // For now, return a mock estimate
    let baseCount = 100
    
    switch (options.dateRange) {
      case 'week': baseCount = 25; break
      case 'month': baseCount = 100; break
      case 'quarter': baseCount = 300; break
      case 'all': baseCount = 1000; break
    }
    
    if (options.filterByStatus.length > 0) {
      baseCount = Math.floor(baseCount * (options.filterByStatus.length / 4))
    }
    
    return baseCount
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-500" />
            Export Test Results
          </DialogTitle>
          <DialogDescription>
            Generate reports and export test execution data in various formats
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Format</Label>
            <div className="grid grid-cols-1 gap-3">
              {formatOptions.map((format) => (
                <div
                  key={format.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    options.format === format.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => updateOptions('format', format.value)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      options.format === format.value
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`} />
                    <div>
                      <div className="font-medium">{format.label}</div>
                      <div className="text-sm text-muted-foreground">{format.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Label>
            <Select value={options.dateRange} onValueChange={(value) => updateOptions('dateRange', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Options */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Include in Export
            </Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="details"
                  checked={options.includeDetails}
                  onCheckedChange={(checked) => updateOptions('includeDetails', checked)}
                />
                <Label htmlFor="details" className="text-sm">
                  Test case details and metadata
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="steps"
                  checked={options.includeSteps}
                  onCheckedChange={(checked) => updateOptions('includeSteps', checked)}
                />
                <Label htmlFor="steps" className="text-sm">
                  Individual step results
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notes"
                  checked={options.includeNotes}
                  onCheckedChange={(checked) => updateOptions('includeNotes', checked)}
                />
                <Label htmlFor="notes" className="text-sm">
                  Execution notes and comments
                </Label>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm">Test Status</Label>
                <div className="space-y-2">
                  {statusOptions.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={options.filterByStatus.includes(status)}
                        onCheckedChange={() => toggleArrayOption('filterByStatus', status)}
                      />
                      <Label htmlFor={`status-${status}`} className="text-sm capitalize">
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <Label className="text-sm">Priority</Label>
                <div className="space-y-2">
                  {priorityOptions.map((priority) => (
                    <div key={priority} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${priority}`}
                        checked={options.filterByPriority.includes(priority)}
                        onCheckedChange={() => toggleArrayOption('filterByPriority', priority)}
                      />
                      <Label htmlFor={`priority-${priority}`} className="text-sm capitalize">
                        {priority}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Export Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Export Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Format:</span>
                <span className="font-medium">{options.format.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Date Range:</span>
                <span className="font-medium">{dateRangeOptions.find(r => r.value === options.dateRange)?.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated Records:</span>
                <span className="font-medium">~{getEstimatedRecords()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>File Size:</span>
                <span className="font-medium">
                  ~{Math.ceil(getEstimatedRecords() / 100)}MB
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={exportResults} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}