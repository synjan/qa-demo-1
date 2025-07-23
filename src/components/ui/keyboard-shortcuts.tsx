"use client"

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Keyboard } from 'lucide-react'

interface ShortcutItem {
  keys: string[]
  description: string
}

interface ShortcutSection {
  title: string
  shortcuts: ShortcutItem[]
}

const shortcuts: ShortcutSection[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['⌘', '/'], description: 'Show keyboard shortcuts' },
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'T'], description: 'Go to Test Cases' },
      { keys: ['G', 'P'], description: 'Go to Test Plans' },
      { keys: ['G', 'H'], description: 'Go to History' },
      { keys: ['G', 'R'], description: 'Go to Reports' },
    ]
  },
  {
    title: 'Test Execution',
    shortcuts: [
      { keys: ['⌘', 'R'], description: 'Run selected test' },
      { keys: ['P'], description: 'Mark test as Passed' },
      { keys: ['F'], description: 'Mark test as Failed' },
      { keys: ['B'], description: 'Mark test as Blocked' },
      { keys: ['S'], description: 'Skip current test' },
      { keys: ['⌘', 'S'], description: 'Save test progress' },
      { keys: ['→'], description: 'Next test step' },
      { keys: ['←'], description: 'Previous test step' },
    ]
  },
  {
    title: 'Browse Tests',
    shortcuts: [
      { keys: ['/', ], description: 'Focus search' },
      { keys: ['⌘', 'A'], description: 'Select all visible tests' },
      { keys: ['⌘', 'D'], description: 'Deselect all' },
      { keys: ['Space'], description: 'Toggle test selection' },
      { keys: ['V'], description: 'Toggle view (Grid/List)' },
      { keys: ['N'], description: 'Next page' },
      { keys: ['P'], description: 'Previous page' },
    ]
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['⌘', ','], description: 'Open settings' },
      { keys: ['⌘', 'Shift', 'P'], description: 'Create new test plan' },
      { keys: ['Esc'], description: 'Close dialogs/Cancel' },
      { keys: ['?'], description: 'Show help' },
    ]
  }
]

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts with Cmd+/ or Cmd+?
      if ((e.metaKey || e.ctrlKey) && (e.key === '/' || e.key === '?')) {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Quick keyboard shortcuts to navigate and use the test runner efficiently
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {shortcuts.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold mb-3">{section.title}</h3>
              <div className="space-y-2">
                {section.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-xs text-muted-foreground text-center">
          Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">⌘</kbd> <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">/</kbd> anytime to show this help
        </div>
      </DialogContent>
    </Dialog>
  )
}