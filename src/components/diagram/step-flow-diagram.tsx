import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import { Pause, Play, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface FlowStep {
  id: string
  label: string
  detail: string
  icon?: LucideIcon
  /** 1-indexed line number in the paired code panel to highlight for this step */
  codeLine?: number
  /** visually mark this node as a decision/branch point */
  tone?: "default" | "success" | "warning"
}

interface StepFlowDiagramProps {
  steps: FlowStep[]
  code?: string[]
  title?: string
  autoPlayMs?: number
  /** called whenever the active step changes, e.g. to sync an external demo */
  onStepChange?: (index: number) => void
}

const TONE_ACTIVE: Record<NonNullable<FlowStep["tone"]>, string> = {
  default: "border-primary bg-primary/10 text-primary",
  success: "border-success bg-success/10 text-success",
  warning: "border-destructive bg-destructive/10 text-destructive",
}

export function StepFlowDiagram({ steps, code, title, autoPlayMs = 1400, onStepChange }: StepFlowDiagramProps) {
  const prefersReducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const displayIndex = hoverIndex ?? index
  const current = steps[displayIndex]

  useEffect(() => {
    onStepChange?.(index)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  useEffect(() => {
    if (!playing) return
    intervalRef.current = setInterval(() => {
      setIndex((prev) => {
        if (prev >= steps.length - 1) {
          setPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, autoPlayMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [playing, autoPlayMs, steps.length])

  function goTo(next: number) {
    setPlaying(false)
    setIndex(Math.max(0, Math.min(steps.length - 1, next)))
  }

  function togglePlay() {
    if (index >= steps.length - 1) setIndex(0)
    setPlaying((p) => !p)
  }

  return (
    <div className="not-prose overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
        <p className="text-sm font-medium text-foreground">{title ?? "Visual flow"}</p>
        <div className="flex items-center gap-1">
          <span className="mr-1 hidden text-xs text-muted-foreground sm:inline">
            Step {index + 1} of {steps.length}
          </span>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous step">
            <ChevronLeft className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={togglePlay} aria-label={playing ? "Pause" : "Play animation"}>
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => goTo(index + 1)} disabled={index === steps.length - 1} aria-label="Next step">
            <ChevronRight className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => goTo(0)} aria-label="Restart">
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className={cn("grid gap-0", code ? "md:grid-cols-2" : "")}>
        <div className="flex flex-col items-stretch gap-0 p-5">
          {steps.map((step, i) => {
            const isActive = i === displayIndex
            const isPast = i < index && !isActive
            const Icon = step.icon
            const tone = step.tone ?? "default"
            return (
              <div key={step.id} className="flex flex-col items-stretch">
                <button
                  type="button"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                  onFocus={() => setHoverIndex(i)}
                  onBlur={() => setHoverIndex(null)}
                  onClick={() => goTo(i)}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border-2 px-4 py-2.5 text-left text-sm transition-colors",
                    isActive
                      ? TONE_ACTIVE[tone]
                      : isPast
                        ? "border-transparent bg-muted/50 text-muted-foreground"
                        : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
                  <span className="font-medium">{step.label}</span>
                </button>
                {i < steps.length - 1 ? (
                  <div className="flex h-6 items-center justify-start pl-6" aria-hidden="true">
                    <motion.svg width="2" height="24" className="overflow-visible">
                      <motion.line
                        x1="1"
                        y1="0"
                        x2="1"
                        y2="24"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        className={cn(i < index ? "text-primary" : "text-border")}
                      />
                      {!prefersReducedMotion && i === index && playing ? (
                        <motion.circle
                          r="3"
                          fill="currentColor"
                          className="text-primary"
                          initial={{ cy: 0 }}
                          animate={{ cy: 24 }}
                          transition={{ duration: autoPlayMs / 1000, ease: "linear" }}
                        />
                      ) : null}
                    </motion.svg>
                  </div>
                ) : null}
              </div>
            )
          })}

          <AnimatePresence mode="wait">
            <motion.p
              key={current.id}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-4 rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground"
            >
              {current.detail}
            </motion.p>
          </AnimatePresence>
        </div>

        {code ? (
          <div className="overflow-x-auto border-t bg-[#0d1117] p-4 font-mono-code text-[13px] leading-relaxed md:border-t-0 md:border-l">
            {code.map((line, i) => (
              <div
                key={i}
                className={cn(
                  "rounded px-2 py-0.5 whitespace-pre text-gray-400 transition-colors",
                  current.codeLine === i + 1 && "bg-primary/20 text-white",
                )}
              >
                {line || " "}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
