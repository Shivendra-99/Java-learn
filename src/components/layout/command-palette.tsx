import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Dialog } from "radix-ui"
import { Search, CheckCircle2, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react"
import { lessons, prefetchLesson, SECTIONS, type Lesson } from "@/lib/lessons-data"
import { useProgress } from "@/context/progress-context"
import { cn } from "@/lib/utils"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Ranks a lesson against the query. Higher is better, 0 means "no match" —
 * a title hit should always outrank a stray word in the description.
 */
function scoreLesson(lesson: Lesson, query: string): number {
  if (!query) return 1
  const q = query.toLowerCase()
  const title = lesson.title.toLowerCase()
  const short = lesson.shortTitle.toLowerCase()
  const description = lesson.description.toLowerCase()
  const section = SECTIONS[lesson.section].toLowerCase()

  if (title.startsWith(q) || short.startsWith(q)) return 100
  if (title.includes(q) || short.includes(q)) return 80
  if (section.includes(q)) return 50
  if (description.includes(q)) return 30
  return 0
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { isComplete } = useProgress()
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  const results = useMemo(() => {
    return lessons
      .map((lesson) => ({ lesson, score: scoreLesson(lesson, query) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.lesson.order - b.lesson.order)
      .map((entry) => entry.lesson)
  }, [query])

  // Clamp the cursor whenever the result set shrinks under it.
  useEffect(() => {
    setActiveIndex((prev) => (prev >= results.length ? 0 : prev))
  }, [results.length])

  useEffect(() => {
    if (open) {
      setQuery("")
      setActiveIndex(0)
    }
  }, [open])

  // Warm the chunk for whatever is under the cursor, so Enter feels instant.
  useEffect(() => {
    const lesson = results[activeIndex]
    if (open && lesson) prefetchLesson(lesson.slug)
  }, [open, results, activeIndex])

  useEffect(() => {
    const item = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    item?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  function select(lesson: Lesson | undefined) {
    if (!lesson) return
    onOpenChange(false)
    navigate(`/lessons/${lesson.slug}`)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((prev) => (results.length === 0 ? 0 : (prev + 1) % results.length))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((prev) => (results.length === 0 ? 0 : (prev - 1 + results.length) % results.length))
    } else if (event.key === "Enter") {
      event.preventDefault()
      select(results[activeIndex])
    } else if (event.key === "Home") {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === "End") {
      event.preventDefault()
      setActiveIndex(Math.max(0, results.length - 1))
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Content
          onKeyDown={onKeyDown}
          aria-describedby={undefined}
          className="fixed top-[12vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <Dialog.Title className="sr-only">Search lessons</Dialog.Title>

          <div className="flex items-center gap-3 border-b px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
              }}
              placeholder="Search lessons…"
              aria-label="Search lessons"
              role="combobox"
              aria-expanded
              aria-controls={listboxId}
              aria-activedescendant={results[activeIndex] ? `${listboxId}-${activeIndex}` : undefined}
              className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div ref={listRef} id={listboxId} role="listbox" aria-label="Lessons" className="max-h-[50vh] overflow-y-auto p-2">
            {results.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No lessons match “{query}”.
              </p>
            ) : (
              results.map((lesson, index) => {
                const Icon = lesson.icon
                const isActive = index === activeIndex
                return (
                  <div
                    key={lesson.slug}
                    id={`${listboxId}-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={isActive}
                    tabIndex={-1}
                    onPointerMove={() => setActiveIndex(index)}
                    onClick={() => select(lesson)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">
                        {lesson.order}. {lesson.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{lesson.description}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{SECTIONS[lesson.section]}</span>
                    {isComplete(lesson.slug) ? (
                      <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
                    ) : null}
                  </div>
                )
              })
            )}
          </div>

          <div className="flex items-center gap-4 border-t bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ArrowUp className="size-3" aria-hidden="true" />
              <ArrowDown className="size-3" aria-hidden="true" />
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="size-3" aria-hidden="true" />
              to open
            </span>
            <span className="ml-auto">esc to close</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
