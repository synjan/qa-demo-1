'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, X } from 'lucide-react'
import Link from 'next/link'

interface QuickAction {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  action?: string
  color: string
  category: string
}

interface QuickActionsWidgetProps {
  actions: QuickAction[]
  onQuickAction: (action: string) => void
  editMode: boolean
  onRemove?: () => void
}

export function QuickActionsWidget({ actions, onQuickAction, editMode, onRemove }: QuickActionsWidgetProps) {
  return (
    <div className="relative mb-8">
      {editMode && onRemove && (
        <Button
          variant="destructive"
          size="sm"
          className="absolute -top-2 -right-2 z-10 h-6 w-6 p-0 rounded-full"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      
      <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Card key={action.title} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${action.color} text-white`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base leading-tight">{action.title}</CardTitle>
                </div>
              </div>
              <CardDescription className="text-sm leading-snug">{action.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {action.href ? (
                <Link href={action.href}>
                  <Button className="w-full" size="sm">
                    <Play className="h-3 w-3 mr-2" />
                    Start
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={() => onQuickAction(action.action!)}
                >
                  <Play className="h-3 w-3 mr-2" />
                  Open
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}