import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Highlight, themes } from "prism-react-renderer"
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, SquareTerminal, Variable } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface TraceStep {
  /** 1-indexed line of `code` being executed at this step */
  line: number
  /**
   * Variables in scope after this line runs, as name -> printed value. Values
   * are merged forward, so a step only needs to list what it changed; pass an
   * empty string as the value to drop a variable that has gone out of scope.
   */
  vars?: Record<string, string>
  /** a line the program prints at this step, appended to the console panel */
  output?: string
  /** plain-English "what just happened" */
  note?: string
}

interface ExecutionTraceProps {
  code: string
  steps: TraceStep[]
  title?: string
  filename?: string
  language?: string
  autoPlayMs?: number
}

interface TraceState {
  vars: Array<{ name: string; value: string; changed: boolean }>
  output: string[]
}

/**
 * Builds the visible state at `index` by replaying every step from the start.
 * Replaying is cheap for the handful of steps a lesson has, and it means
 * jumping straight to step 7 shows exactly the same state as stepping there.
 */
function replay(steps: TraceStep[], index: number): TraceState {
  const vars = new Map<string, string>()
  const changed = new Set<string>()
  const output: string[] = []

  steps.slice(0, index + 1).forEach((step, stepIndex) => {
    if (stepIndex === index) changed.clear()
    for (const [name, value] of Object.entries(step.vars ?? {})) {
      if (value === "") {
        vars.delete(name)
      } else {
        if (stepIndex === index && vars.get(name) !== value) changed.add(name)
        vars.set(name, value)
      }
    }
    if (step.output !== undefined) output.push(step.output)
  })

  return {
    vars: [...vars].map(([name, value]) => ({ name, value, changed: changed.has(name) })),
    output,
  }
}

/**
 * Steps through a snippet one line at a time, showing the variables and the
 * console output as they change. Reading Java is mostly a matter of holding
 * "what is each variable right now" in your head; this puts that on screen so
 * loops, reassignment, and reference semantics stop being guesswork.
 */
export function ExecutionTrace({
  code,
  steps,
  title = "Run it line by line",
  filename = "Main.java",
  language = "java",
  autoPlayMs = 1600,
}: ExecutionTraceProps) {
  const prefersReducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const codeRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  const trimmed = useMemo(() => code.trim(), [code])
  const current = steps[index]
  const state = useMemo(() => replay(steps, index), [steps, index])

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

  // Keep the active line visible inside the code panel only — scrollIntoView
  // would drag the whole page along with it.
  useEffect(() => {
    const container = codeRef.current
    const lineEl = lineRefs.current[current?.line - 1]
    if (!container || !lineEl) return
    const top = lineEl.offsetTop
    const bottom = top + lineEl.offsetHeight
    if (top < container.scrollTop || bottom > container.scrollTop + container.clientHeight) {
      container.scrollTo({ top: top - container.clientHeight / 2, behavior: prefersReducedMotion ? "auto" : "smooth" })
    }
  }, [current?.line, prefersReducedMotion])

  return (
    <div className="not-prose overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Variable className="size-4 text-primary" aria-hidden="true" />
          {title}
        </p>
        <span className="text-xs text-muted-foreground">
          Step {index + 1} / {steps.length}
        </span>
      </div>

      <div className="grid lg:grid-cols-[1.25fr_1fr]">
        <div ref={codeRef} className="max-h-[22rem] overflow-auto bg-[#0d1117] py-3 text-[12.5px] leading-relaxed">
          <p className="px-4 pb-2 font-mono-code text-[11px] text-gray-500">{filename}</p>
          <Highlight code={trimmed} language={language} theme={themes.vsDark}>
            {({ tokens, getLineProps, getTokenProps }) => (
              <pre className="min-w-max font-mono-code">
                {tokens.map((line, i) => {
                  const { key: _lineKey, ...lineProps } = getLineProps({ line })
                  const isActive = current?.line === i + 1
                  return (
                    <div
                      key={i}
                      {...lineProps}
                      ref={(el) => {
                        lineRefs.current[i] = el
                      }}
                      className={cn(
                        "flex gap-3 border-l-2 px-4 transition-colors duration-150",
                        isActive ? "border-l-primary bg-primary/15" : "border-l-transparent opacity-60",
                        lineProps.className,
                      )}
                    >
                      <span className="w-5 shrink-0 text-right text-gray-600 select-none">{i + 1}</span>
                      <span>
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

        <div className="grid grid-rows-[auto_auto] divide-y border-t lg:border-t-0 lg:border-l">
          <div className="p-4">
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Variables</p>
            {state.vars.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing declared yet.</p>
            ) : (
              <ul className="space-y-1">
                {state.vars.map((entry) => (
                  <li
                    key={entry.name}
                    className={cn(
                      "flex items-baseline justify-between gap-3 rounded-md px-2 py-1 font-mono-code text-[12.5px] transition-colors",
                      entry.changed ? "bg-primary/12 text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span className="shrink-0">{entry.name}</span>
                    <span className={cn("truncate text-right", entry.changed && "font-semibold text-primary")}>
                      {entry.value}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <SquareTerminal className="size-3.5" aria-hidden="true" />
              Console
            </p>
            <div className="min-h-16 rounded-md bg-[#0d1117] px-3 py-2 font-mono-code text-[12.5px] leading-relaxed text-gray-300">
              {state.output.length === 0 ? (
                <span className="text-gray-600">(no output yet)</span>
              ) : (
                state.output.map((line, i) => (
                  <div key={i} className="whitespace-pre-wrap">
                    {line || " "}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {current?.note ? (
          <motion.p
            key={index}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="border-t bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground [&_code]:font-mono-code [&_code]:text-foreground"
          >
            {current.note}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={() => setPlaying((prev) => !prev)}
          disabled={index >= steps.length - 1}
        >
          {playing ? <Pause className="size-3.5" aria-hidden="true" /> : <Play className="size-3.5" aria-hidden="true" />}
          {playing ? "Pause" : "Play"}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={() => goTo(index - 1)} disabled={index === 0}>
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          Back
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="gap-1.5"
          onClick={() => goTo(index + 1)}
          disabled={index >= steps.length - 1}
        >
          Step
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Button>
        {index > 0 ? (
          <Button type="button" size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => goTo(0)}>
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  )
}
