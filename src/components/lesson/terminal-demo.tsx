import { useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { ChevronRight, RotateCcw, TerminalSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface TerminalStep {
  command: string
  /** the lines the terminal prints back, exactly as they appear */
  output?: string[]
  /** the plain-English "what just happened", shown under the terminal */
  note?: string
}

interface TerminalDemoProps {
  steps: TerminalStep[]
  title?: string
  /** the shell prompt prefix, e.g. "~/my-project" */
  prompt?: string
}

/**
 * A fake terminal the reader steps through one command at a time. Compiling and
 * running Java means a sequence of commands whose output matters — javac errors,
 * java output, jar listings — and a static block of pasted text hides which line
 * came from which command. Here each command and its output arrive together,
 * with a note explaining what actually happened.
 */
export function TerminalDemo({ steps, title = "Try the sequence", prompt = "~/my-project" }: TerminalDemoProps) {
  const prefersReducedMotion = useReducedMotion()
  const [run, setRun] = useState(0)

  const done = run >= steps.length
  const next = steps[run]
  const lastNote = run > 0 ? steps[run - 1].note : undefined

  return (
    <div className="not-prose overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <TerminalSquare className="size-4 text-primary" aria-hidden="true" />
          {title}
        </p>
        <span className="text-xs text-muted-foreground">
          {Math.min(run, steps.length)} / {steps.length}
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto bg-[#0d1117] px-4 py-3 font-mono-code text-[12.5px] leading-relaxed">
        {run === 0 ? (
          <p className="text-gray-500">Run the first command to start.</p>
        ) : null}
        {steps.slice(0, run).map((step, index) => (
          <motion.div
            key={index}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-2"
          >
            <div className="whitespace-pre-wrap">
              <span className="text-emerald-400">{prompt}</span>
              <span className="text-gray-500"> $ </span>
              <span className="text-gray-100">{step.command}</span>
            </div>
            {(step.output ?? []).map((line, lineIndex) => (
              <div key={lineIndex} className="whitespace-pre-wrap text-gray-400">
                {line || " "}
              </div>
            ))}
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {lastNote ? (
          <motion.p
            key={run}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="border-t bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground"
          >
            {lastNote}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3">
        <Button type="button" size="sm" disabled={done} onClick={() => setRun((prev) => prev + 1)} className="gap-1.5">
          <ChevronRight className="size-3.5" aria-hidden="true" />
          {done ? "All commands run" : "Run: " + next.command}
        </Button>
        {run > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-1.5 text-muted-foreground"
            onClick={() => setRun(0)}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  )
}
