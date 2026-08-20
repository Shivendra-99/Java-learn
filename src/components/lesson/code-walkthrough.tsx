import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Highlight, themes } from "prism-react-renderer"
import { Pause, Play, ChevronLeft, ChevronRight, RotateCcw, FileCode2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface WalkthroughStep {
  id: string
  /** short title shown in the step list */
  label: string
  /** the explanation revealed when this step is active */
  detail: string
  /** 1-indexed line(s) of `code` this step is talking about */
  lines?: number | number[]
  /** inclusive 1-indexed range, e.g. [3, 6] highlights lines 3 through 6 */
  range?: [number, number]
  icon?: LucideIcon
}

interface CodeWalkthroughProps {
  steps: WalkthroughStep[]
  code: string
  /** shown in the code panel header, e.g. ".github/workflows/ci.yml" */
  filename?: string
  language?: string
  title?: string
  autoPlayMs?: number
}

function toLineSet(step: WalkthroughStep | undefined): Set<number> {
  const out = new Set<number>()
  if (!step) return out
  if (typeof step.lines === "number") {
    out.add(step.lines)
  } else if (step.lines) {
    for (const n of step.lines) out.add(n)
  }
  if (step.range) {
    const [start, end] = step.range
    for (let n = start; n <= end; n++) out.add(n)
  }
  return out
}

/**
 * Steps on the left, the code they refer to on the right, kept in sync: picking
 * a step lights up its lines and dims the rest, so the reader never has to hunt
 * for "which part are we talking about now". Play walks the steps on a timer.
 */
export function CodeWalkthrough({
  steps,
  code,
  filename,
  language = "bash",
  title = "Walkthrough",
  autoPlayMs = 2600,
}: CodeWalkthroughProps) {
  const prefersReducedMotion = useReducedMotion()
  const markerId = useId()
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const codeRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  const trimmed = useMemo(() => code.trim(), [code])
  const current = steps[index]
  const activeLines = useMemo(() => toLineSet(current), [current])

  const goTo = useCallback(
    (next: number) => {
      setPlaying(false)
      setIndex(Math.max(0, Math.min(steps.length - 1, next)))
    },
    [steps.length],
  )

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setIndex((prev) => {
        if (prev >= steps.length - 1) {
          setPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, autoPlayMs)
    return () => clearInterval(id)
  }, [playing, autoPlayMs, steps.length])

  // Scroll the highlighted lines into view inside the code panel only — using
  // scrollIntoView here would drag the whole page along with it.
  useEffect(() => {
    const container = codeRef.current
    if (!container || activeLines.size === 0) return
    const first = Math.min(...activeLines)
    const el = lineRefs.current[first - 1]
    if (!el) return
    const target = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2
    container.scrollTo({
      top: Math.max(0, target),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    })
  }, [activeLines, prefersReducedMotion])

  function togglePlay() {
    if (index >= steps.length - 1) setIndex(0)
    setPlaying((p) => !p)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault()
      goTo(index + 1)
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault()
      goTo(index - 1)
    }
  }

  return (
    <div className="not-prose overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <div className="flex items-center gap-1">
          <span className="mr-1 hidden text-xs text-muted-foreground sm:inline">
            Step {index + 1} of {steps.length}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous step"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={togglePlay}
            aria-label={playing ? "Pause walkthrough" : "Play walkthrough"}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => goTo(index + 1)}
            disabled={index === steps.length - 1}
            aria-label="Next step"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => goTo(0)}
            aria-label="Restart walkthrough"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Left: the steps */}
        <ol
          className="flex list-none flex-col gap-1 p-3 pl-0 focus-visible:outline-none"
          tabIndex={0}
          onKeyDown={onKeyDown}
          aria-label={`${title} steps`}
        >
          {steps.map((step, i) => {
            const isActive = i === index
            const isPast = i < index
            const Icon = step.icon
            return (
              <li key={step.id} className="relative">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "relative flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    isActive ? "bg-primary/10" : "hover:bg-muted/60",
                  )}
                >
                  {isActive && !prefersReducedMotion ? (
                    <motion.span
                      layoutId={`${markerId}-marker`}
                      className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      aria-hidden="true"
                    />
                  ) : null}

                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isPast
                          ? "bg-success/20 text-success"
                          : "bg-muted text-muted-foreground",
                    )}
                    aria-hidden="true"
                  >
                    {Icon ? <Icon className="size-3" /> : i + 1}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm font-medium transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </span>

                    <AnimatePresence initial={false}>
                      {isActive ? (
                        <motion.span
                          initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="block overflow-hidden"
                        >
                          <span className="mt-1 block text-sm text-muted-foreground">{step.detail}</span>
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        {/* Right: the code */}
        <div className="flex min-w-0 flex-col border-t md:border-t-0 md:border-l">
          {filename ? (
            <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
              <FileCode2 className="size-3.5" aria-hidden="true" />
              <span className="font-mono-code">{filename}</span>
            </div>
          ) : null}
          <div
            ref={codeRef}
            className="max-h-[26rem] overflow-auto bg-[#0d1117] p-4 font-mono-code text-[13px] leading-relaxed"
          >
            <Highlight code={trimmed} language={language} theme={themes.vsDark}>
              {({ tokens, getLineProps, getTokenProps }) => (
                <pre className="min-w-max">
                  {tokens.map((line, i) => {
                    const lineNumber = i + 1
                    const isActive = activeLines.has(lineNumber)
                    const dimmed = activeLines.size > 0 && !isActive
                    const { key: _lineKey, ...lineProps } = getLineProps({ line })
                    return (
                      <div
                        key={i}
                        ref={(el) => {
                          lineRefs.current[i] = el
                        }}
                        {...lineProps}
                        className={cn(
                          "-mx-2 flex rounded px-2 transition-all duration-300",
                          isActive && "bg-primary/25 ring-1 ring-primary/40",
                          dimmed && "opacity-35",
                        )}
                      >
                        <span
                          className={cn(
                            "mr-4 inline-block w-6 shrink-0 text-right select-none",
                            isActive ? "text-primary-foreground/90" : "text-gray-600",
                          )}
                          aria-hidden="true"
                        >
                          {lineNumber}
                        </span>
                        <span className="flex-1">
                          {line.map((token, key) => {
                            const { key: _tokenKey, ...tokenProps } = getTokenProps({ token })
                            return <span key={key} {...tokenProps} />
                          })}
                        </span>
                      </div>
                    )
                  })}
                </pre>
              )}
            </Highlight>
          </div>
        </div>
      </div>
    </div>
  )
}
