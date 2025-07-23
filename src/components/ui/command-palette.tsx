"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DialogProps } from "@radix-ui/react-dialog"
import {
  Circle,
  File,
  Search,
  TestTube2,
  FolderOpen,
  GitBranch,
  BarChart3,
  Sparkles,
  Play,
  History,
  FileText,
  Settings,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

interface CommandPaletteProps extends DialogProps {
  testCases?: Array<{ id: string; title: string; priority: string }>
}

export function CommandPalette({ testCases = [], ...props }: CommandPaletteProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search...</span>
        <span className="sr-only">Search</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/"))}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/test-runner/browse"))}
            >
              <TestTube2 className="mr-2 h-4 w-4" />
              Browse Tests
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/test-runner/plans"))}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Test Plans
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/test-runner/history"))}
            >
              <History className="mr-2 h-4 w-4" />
              Execution History
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/test-runner/reports"))}
            >
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/test-runner/browse"))}
            >
              <Play className="mr-2 h-4 w-4" />
              Run a Test
              <CommandShortcut>⌘R</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/test-runner/plans"))}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Create Test Plan
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          {testCases.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Recent Test Cases">
                {testCases.slice(0, 5).map((testCase) => (
                  <CommandItem
                    key={testCase.id}
                    value={testCase.title}
                    onSelect={() => {
                      runCommand(() => router.push(`/test-runner/execute/${testCase.id}`))
                    }}
                  >
                    <File className="mr-2 h-4 w-4" />
                    {testCase.title}
                    <span className={cn(
                      "ml-auto text-xs",
                      testCase.priority === "high" && "text-red-600",
                      testCase.priority === "medium" && "text-yellow-600",
                      testCase.priority === "low" && "text-green-600"
                    )}>
                      {testCase.priority}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/settings"))}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
              <CommandShortcut>⌘,</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}