'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, BarChart3, Zap, Activity, TrendingUp, Clock, Monitor } from 'lucide-react'

interface Widget {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  category: string
}

interface AddWidgetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableWidgets: Widget[]
  onAddWidget: (widgetId: string) => void
}

export function AddWidgetModal({ open, onOpenChange, availableWidgets, onAddWidget }: AddWidgetModalProps) {
  const getWidgetIcon = (IconComponent: React.ComponentType<{ className?: string }>) => {
    return <IconComponent className="h-6 w-6" />
  }

  const handleAddWidget = (widgetId: string) => {
    onAddWidget(widgetId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Widget to Dashboard
          </DialogTitle>
          <DialogDescription>
            Choose widgets to enhance your dashboard experience
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {availableWidgets.map((widget) => (
            <Card key={widget.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {getWidgetIcon(widget.icon)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{widget.label}</CardTitle>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {widget.category}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-4">
                  {widget.description}
                </CardDescription>
                <Button 
                  className="w-full" 
                  onClick={() => handleAddWidget(widget.id)}
                  size="sm"
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Add Widget
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {availableWidgets.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Monitor className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">All widgets are active</p>
            <p className="text-sm">You're using all available widgets on your dashboard</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}