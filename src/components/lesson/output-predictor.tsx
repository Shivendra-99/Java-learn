import { useMemo, type ReactNode } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Highlight, themes } from "prism-react-renderer"
import { CircleCheck, CircleX, RotateCcw, SquareTerminal } from "lucide-react"
import { useProgress } from "@/context/progress-context"
import { cn } from "@/lib/utils"

interface OutputOption {
  id: string
  /** the candidate output — newlines render as separate console lines */
  text: string
  /** use for "it doesn't compile" / "it throws" style options */
  label?: string
}

interface OutputPredictorProps {
  code: string
  options: OutputOption[]
  correctId: string
  explanation: ReactNode
  question?: string
  filename?: string
  language?: string
  /** stable key for saving the answer; defaults to a hash of the code */
  id?: string
}

// djb2. Only needs to be stable across reloads and collision-free across the
// handful of snippets in the course, not cryptographic.
function hash(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

/**
 * "What does this print?" — the question Java interviews and Java bugs are both
 * made of. Committing to an answer before scrolling is what turns a snippet the
 * reader skimmed into one they actually reasoned about, so the explanation stays
 * hidden until they pick.
 */
export function OutputPredictor({
  code,
  options,
  correctId,
  explanation,
  question = "What does this print?",
  filename = "Main.java",
  language = "java",
  id,
}: OutputPredictorProps) {
  const prefersReducedMotion = useReducedMotion()
  const { getQuizAnswer, setQuizAnswer, clearQuizAnswer } = useProgress()

  const trimmed = code.trim()
  const quizId = useMemo(() => id ?? `out_${hash(trimmed)}`, [id, trimmed])
  const saved = getQuizAnswer(quizId)
  const selected = saved?.answer ?? null
  const answered = selected !== null
  const isCorrect = selected === correctId

  return (
    <div className="not-prose overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <SquareTerminal className="size-4 text-primary" aria-hidden="true" />
          {question}
        </div>
        {answered ? (
          <button
            type="button"
            onClick={() => clearQuizAnswer(quizId)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-3" aria-hidden="true" />
            Try again
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto bg-[#0d1117] px-4 py-3 text-[12.5px] leading-relaxed">
        <p className="pb-2 font-mono-code text-[11px] text-gray-500">{filename}</p>
        <Highlight code={trimmed} language={language} theme={themes.vsDark}>
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre className="min-w-max font-mono-code">
              {tokens.map((line, i) => {
                const { key: _lineKey, ...lineProps } = getLineProps({ line })
                return (
                  <div key={i} {...lineProps} className={cn(lineProps.className)}>
                    {line.map((token, key) => {
                      const { key: _tokenKey, ...tokenProps } = getTokenProps({ token })
                      return <span key={key} {...tokenProps} />
                    })}
                  </div>
                )
              })}
            </pre>
          )}
        </Highlight>
      </div>

      <div className="space-y-2 p-4" role="radiogroup" aria-label={question}>
        {options.map((option) => {
          const isSelected = selected === option.id
          const revealCorrect = answered && option.id === correctId
          const revealWrong = answered && isSelected && option.id !== correctId
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setQuizAnswer(quizId, option.id, option.id === correctId)}
              className={cn(
                "flex w-full items-start justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors",
                revealCorrect && "border-success bg-success/10",
                revealWrong && "border-destructive bg-destructive/10",
                !revealCorrect && !revealWrong && isSelected && "border-primary bg-primary/5",
                !isSelected && !revealCorrect && "border-border hover:bg-muted/50",
              )}
            >
              <span className="min-w-0">
                {option.label ? <span className="block text-sm text-foreground">{option.label}</span> : null}
                {option.text ? (
                  <span className="block font-mono-code text-[12.5px] whitespace-pre-wrap text-muted-foreground">
                    {option.text}
                  </span>
                ) : null}
              </span>
              {revealCorrect ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" /> : null}
              {revealWrong ? <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" /> : null}
            </button>
          )
        })}

        <AnimatePresence>
          {answered ? (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  "rounded-lg px-3.5 py-2.5 text-sm",
                  isCorrect ? "bg-success/10" : "bg-primary/5",
                )}
              >
                <p className="mb-1 font-semibold text-foreground">
                  {isCorrect ? "Correct — here's why:" : "Not quite — here's why:"}
                </p>
                <div className="text-muted-foreground [&_code]:font-mono-code [&_code]:text-foreground [&_strong]:text-foreground">
                  {explanation}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
