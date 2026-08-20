import { useEffect, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Cpu, FileCode2, Hammer, Binary, Monitor, Apple, Terminal } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PipelineStage {
  id: string
  label: string
  sublabel: string
  detail: string
  icon: LucideIcon
}

interface CompilePipelineProps {
  stages?: PipelineStage[]
  /** the platforms the last stage fans out to — the "run anywhere" half */
  targets?: Array<{ label: string; icon: LucideIcon }>
  title?: string
  autoPlayMs?: number
}

export const DEFAULT_STAGES: PipelineStage[] = [
  {
    id: "source",
    label: "Hello.java",
    sublabel: "source",
    detail: "Text you wrote. Readable by humans, meaningless to the CPU. Its name has to match the public class inside it.",
    icon: FileCode2,
  },
  {
    id: "javac",
    label: "javac",
    sublabel: "compiler",
    detail: "The compiler checks types, resolves names, and rejects anything that can't possibly work — this is where most of your mistakes get caught.",
    icon: Hammer,
  },
  {
    id: "bytecode",
    label: "Hello.class",
    sublabel: "bytecode",
    detail: "Instructions for an imaginary machine, not for your CPU. This one file is what you ship — the same bytes run everywhere.",
    icon: Binary,
  },
  {
    id: "jvm",
    label: "JVM",
    sublabel: "loads, verifies, runs",
    detail: "The Java Virtual Machine loads the class, verifies the bytecode is safe, interprets it, then JIT-compiles the hot parts into native code.",
    icon: Cpu,
  },
]

const DEFAULT_TARGETS = [
  { label: "Windows", icon: Monitor },
  { label: "macOS", icon: Apple },
  { label: "Linux", icon: Terminal },
]

/**
 * The "write once, run anywhere" claim as a diagram: one source file becomes one
 * bytecode file, and a per-platform JVM is what turns it into something the
 * local CPU understands. Cycling through the stages keeps the hero moving on the
 * home page and doubles as the explainer inside the lesson.
 */
export function CompilePipeline({
  stages = DEFAULT_STAGES,
  targets = DEFAULT_TARGETS,
  title = "One source file, every platform",
  autoPlayMs = 2600,
}: CompilePipelineProps) {
  const prefersReducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || prefersReducedMotion) return
    const id = setInterval(() => setIndex((prev) => (prev + 1) % stages.length), autoPlayMs)
    return () => clearInterval(id)
  }, [paused, prefersReducedMotion, autoPlayMs, stages.length])

  const active = stages[index]

  return (
    <div
      className="not-prose overflow-hidden rounded-xl border bg-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="border-b bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground">{title}</div>

      <div className="space-y-3 p-4">
        <ol className="flex flex-col gap-2 sm:flex-row sm:items-stretch lg:grid lg:grid-cols-2">
          {stages.map((stage, stageIndex) => {
            const Icon = stage.icon
            const isActive = stageIndex === index
            const isPast = stageIndex < index
            return (
              <li key={stage.id} className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIndex(stageIndex)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex w-full flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "border-primary bg-primary/10"
                      : isPast
                        ? "border-primary/25 bg-primary/[0.04]"
                        : "border-border bg-muted/20 hover:bg-accent/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md",
                      isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="font-mono-code text-[12.5px] font-medium text-foreground">{stage.label}</span>
                  <span className="text-[11px] text-muted-foreground">{stage.sublabel}</span>
                </button>
                {stageIndex < stages.length - 1 ? (
                  <span className="hidden shrink-0 text-muted-foreground sm:inline lg:hidden" aria-hidden="true">
                    →
                  </span>
                ) : null}
              </li>
            )
          })}
        </ol>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed px-3 py-2.5">
          <span className="text-xs text-muted-foreground">then runs unchanged on</span>
          {targets.map((target) => (
            <span
              key={target.label}
              className="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs text-foreground"
            >
              <target.icon className="size-3.5 text-primary" aria-hidden="true" />
              {target.label}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={active.id}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
        >
          <span className="font-medium text-foreground">{active.label}</span> — {active.detail}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
