import { useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { ChevronLeft, ChevronRight, Layers, MemoryStick, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface HeapObject {
  /** stable id referenced by StackVar.ref — also shown as the object's address */
  id: string
  /** e.g. "Person", "int[3]", "String" */
  type: string
  fields?: Array<[string, string]>
  /** "new" flashes the card as freshly allocated, "garbage" greys it out */
  tone?: "default" | "new" | "garbage"
}

export interface StackVar {
  name: string
  /** printed value for a primitive, e.g. "42" */
  value?: string
  /** id of the heap object this variable points at */
  ref?: string
  /** true when this variable holds null */
  isNull?: boolean
}

export interface StackFrame {
  id: string
  /** e.g. "main()" or "greet(String)" */
  label: string
  vars: StackVar[]
}

export interface MemoryStep {
  label: string
  detail: string
  /** frames listed outermost-first; the last one is the currently running frame */
  stack: StackFrame[]
  heap: HeapObject[]
}

interface MemoryDiagramProps {
  steps: MemoryStep[]
  title?: string
}

const TONE_CARD: Record<NonNullable<HeapObject["tone"]>, string> = {
  default: "border-border bg-card",
  new: "border-primary/60 bg-primary/8",
  garbage: "border-dashed border-muted-foreground/40 bg-muted/40 opacity-60",
}

/**
 * Two panels — the call stack on the left, the heap on the right — advanced one
 * step at a time. Nearly every "why did my object change?" question in Java has
 * the same answer: two stack variables were pointing at one heap object. Rather
 * than draw arrows (which need measured layout), a reference renders as a chip
 * carrying the target's address, and hovering it lights up the matching card.
 */
export function MemoryDiagram({ steps, title = "Stack and heap, step by step" }: MemoryDiagramProps) {
  const prefersReducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [focus, setFocus] = useState<string | null>(null)

  const step = steps[index]

  function goTo(next: number) {
    setIndex(Math.max(0, Math.min(steps.length - 1, next)))
  }

  return (
    <div className="not-prose overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MemoryStick className="size-4 text-primary" aria-hidden="true" />
          {title}
        </p>
        <span className="text-xs text-muted-foreground">
          {index + 1} / {steps.length}
        </span>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-2">
        {/* ------------------------------------------------------------- stack */}
        <div className="bg-card p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <Layers className="size-3.5" aria-hidden="true" />
            Stack
          </p>
          <div className="flex flex-col-reverse gap-2">
            {step.stack.map((frame, frameIndex) => (
              <motion.div
                key={frame.id}
                layout={!prefersReducedMotion}
                initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-lg border px-3 py-2",
                  frameIndex === step.stack.length - 1 ? "border-primary/50 bg-primary/5" : "border-border bg-muted/30",
                )}
              >
                <p className="mb-1.5 font-mono-code text-[11px] font-semibold text-foreground">{frame.label}</p>
                {frame.vars.length === 0 ? (
                  <p className="text-xs text-muted-foreground">no locals</p>
                ) : (
                  <ul className="space-y-1">
                    {frame.vars.map((v) => (
                      <li key={v.name} className="flex items-center justify-between gap-2 font-mono-code text-[12px]">
                        <span className="text-muted-foreground">{v.name}</span>
                        {v.ref ? (
                          <button
                            type="button"
                            onMouseEnter={() => setFocus(v.ref ?? null)}
                            onMouseLeave={() => setFocus(null)}
                            onFocus={() => setFocus(v.ref ?? null)}
                            onBlur={() => setFocus(null)}
                            className={cn(
                              "flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] transition-colors",
                              focus === v.ref
                                ? "border-primary bg-primary/15 text-primary"
                                : "border-primary/30 bg-primary/5 text-primary/90",
                            )}
                          >
                            <span aria-hidden="true">→</span>
                            {v.ref}
                          </button>
                        ) : (
                          <span className={cn(v.isNull ? "text-destructive" : "text-foreground")}>
                            {v.isNull ? "null" : v.value}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* -------------------------------------------------------------- heap */}
        <div className="bg-card p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <MemoryStick className="size-3.5" aria-hidden="true" />
            Heap
          </p>
          {step.heap.length === 0 ? (
            <p className="text-xs text-muted-foreground">No objects allocated yet.</p>
          ) : (
            <div className="grid gap-2">
              {step.heap.map((object) => (
                <motion.div
                  key={object.id}
                  layout={!prefersReducedMotion}
                  initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "rounded-lg border px-3 py-2 transition-shadow",
                    TONE_CARD[object.tone ?? "default"],
                    focus === object.id && "ring-2 ring-primary/60",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-mono-code text-[11px] font-semibold text-foreground">{object.type}</span>
                    <span className="font-mono-code text-[10px] text-muted-foreground">{object.id}</span>
                  </div>
                  {object.fields?.length ? (
                    <ul className="space-y-0.5">
                      {object.fields.map(([name, value]) => (
                        <li key={name} className="flex items-center justify-between gap-2 font-mono-code text-[12px]">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="text-foreground">{value}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {object.tone === "garbage" ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">unreachable — eligible for GC</p>
                  ) : null}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="border-t bg-muted/40 px-4 py-2.5"
        >
          <p className="text-sm font-medium text-foreground">{step.label}</p>
          <p className="mt-0.5 text-sm text-muted-foreground [&_code]:font-mono-code [&_code]:text-foreground">
            {step.detail}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3">
        <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={() => goTo(index - 1)} disabled={index === 0}>
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          Back
        </Button>
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          onClick={() => goTo(index + 1)}
          disabled={index >= steps.length - 1}
        >
          Next
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
