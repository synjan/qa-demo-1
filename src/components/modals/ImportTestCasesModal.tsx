'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { TestCase } from '@/lib/types'

interface ImportTestCasesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors: string[]
  testCases: TestCase[]
}

export function ImportTestCasesModal({ open, onOpenChange }: ImportTestCasesModalProps) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supportedFormats = [
    { format: 'CSV', description: 'Comma-separated values with headers', example: 'title,description,priority,steps' },
    { format: 'JSON', description: 'Test cases in JSON array format', example: '[{"title": "Test", "steps": [...]}]' }
  ]

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setImportResult(null)
    previewFile(file)
  }

  const previewFile = async (file: File) => {
    try {
      const text = await file.text()
      
      if (file.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim())
        const preview = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim())
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = values[index] || ''
          })
          return obj
        })
        setPreviewData(preview)
      } else if (file.name.endsWith('.json')) {
        const data = JSON.parse(text)
        setPreviewData(Array.isArray(data) ? data.slice(0, 5) : [data])
      }
    } catch (error) {
      console.error('Failed to preview file:', error)
      setPreviewData([])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const file = files[0]
    
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.json'))) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const importTestCases = async () => {
    if (!selectedFile) return

    setImporting(true)
    setImportProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/testcases/import', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setImportProgress(100)

      if (response.ok) {
        const result = await response.json()
        setImportResult(result)
      } else {
        throw new Error('Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      setImportResult({
        success: false,
        imported: 0,
        failed: previewData.length,
        errors: ['Failed to import test cases. Please check the file format.'],
        testCases: []
      })
    } finally {
      setImporting(false)
    }
  }

  const resetModal = () => {
    setSelectedFile(null)
    setPreviewData([])
    setImportResult(null)
    setImportProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const closeModal = () => {
    resetModal()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-green-500" />
            Import Test Cases
          </DialogTitle>
          <DialogDescription>
            Upload test cases from CSV or JSON files to quickly populate your test suite
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!selectedFile && !importResult && (
            <>
              {/* Supported Formats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supportedFormats.map((format) => (
                  <Card key={format.format}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{format.format} Format</CardTitle>
                      <CardDescription className="text-sm">
                        {format.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <code className="text-xs bg-muted p-2 rounded block">
                        {format.example}
                      </code>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Drop your file here</h3>
                <p className="text-muted-foreground mb-4">
                  or click to browse for CSV or JSON files
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </>
          )}

          {selectedFile && !importResult && (
            <>
              {/* File Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>File Preview: {selectedFile.name}</span>
                    <Badge variant="outline">
                      {previewData.length} items
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Preview of the first 5 records from your file
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {previewData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {Object.keys(previewData[0]).map((key) => (
                              <th key={key} className="text-left p-2 font-medium">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, index) => (
                            <tr key={index} className="border-b">
                              {Object.values(row).map((value: any, cellIndex) => (
                                <td key={cellIndex} className="p-2 max-w-[200px] truncate">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No valid data found in file
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Import Progress */}
              {importing && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Importing test cases...</span>
                      </div>
                      <Progress value={importProgress} className="w-full" />
                      <p className="text-xs text-muted-foreground">
                        Processing {previewData.length} test cases
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Import {importResult.success ? 'Completed' : 'Failed'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {importResult.imported}
                      </div>
                      <div className="text-sm text-muted-foreground">Imported</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {importResult.failed}
                      </div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {importResult.imported + importResult.failed}
                      </div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round((importResult.imported / (importResult.imported + importResult.failed)) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        Errors ({importResult.errors.length})
                      </h4>
                      <div className="bg-muted p-3 rounded text-sm space-y-1 max-h-32 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="text-red-600">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          {!importResult ? (
            <>
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button 
                onClick={selectedFile ? importTestCases : () => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : selectedFile ? (
                  'Import Test Cases'
                ) : (
                  'Choose File'
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={resetModal}>
                Import Another File
              </Button>
              <Button onClick={closeModal}>
                Done
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}