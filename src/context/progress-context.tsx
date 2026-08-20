import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { lessons } from "@/lib/lessons-data"

interface ProgressContextValue {
  completedSlugs: Set<string>
  isComplete: (slug: string) => boolean
  toggleComplete: (slug: string) => void
  completedCount: number
  totalCount: number
  /** answered quiz id -> what the learner picked and whether it was right */
  quizAnswers: Record<string, QuizAnswer>
  getQuizAnswer: (quizId: string) => QuizAnswer | undefined
  setQuizAnswer: (quizId: string, optionId: string, correct: boolean) => void
  clearQuizAnswer: (quizId: string) => void
  quizAnsweredCount: number
  quizCorrectCount: number
}

export interface QuizAnswer {
  /** the option id the learner picked */
  answer: string
  correct: boolean
}

const STORAGE_KEY = "java-learn:progress"
const QUIZ_STORAGE_KEY = "java-learn:quiz"

const ProgressContext = createContext<ProgressContextValue | null>(null)

function loadCompleted(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed.filter((v): v is string => typeof v === "string")) : new Set()
  } catch {
    return new Set()
  }
}

function loadQuizAnswers(): Record<string, QuizAnswer> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(QUIZ_STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    const out: Record<string, QuizAnswer> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== "object") continue
      const { answer, correct } = value as Partial<QuizAnswer>
      if (typeof answer === "string" && typeof correct === "boolean") {
        out[key] = { answer, correct }
      }
    }
    return out
  } catch {
    return {}
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(loadCompleted)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, QuizAnswer>>(loadQuizAnswers)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedSlugs]))
  }, [completedSlugs])

  useEffect(() => {
    window.localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(quizAnswers))
  }, [quizAnswers])

  const toggleComplete = (slug: string) => {
    setCompletedSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
      } else {
        next.add(slug)
      }
      return next
    })
  }

  const isComplete = (slug: string) => completedSlugs.has(slug)

  const getQuizAnswer = (quizId: string) => quizAnswers[quizId]

  const setQuizAnswer = (quizId: string, optionId: string, correct: boolean) => {
    setQuizAnswers((prev) => ({ ...prev, [quizId]: { answer: optionId, correct } }))
  }

  const clearQuizAnswer = (quizId: string) => {
    setQuizAnswers((prev) => {
      if (!(quizId in prev)) return prev
      const next = { ...prev }
      delete next[quizId]
      return next
    })
  }

  return (
    <ProgressContext.Provider
      value={{
        completedSlugs,
        isComplete,
        toggleComplete,
        completedCount: completedSlugs.size,
        totalCount: lessons.length,
        quizAnswers,
        getQuizAnswer,
        setQuizAnswer,
        clearQuizAnswer,
        quizAnsweredCount: Object.keys(quizAnswers).length,
        quizCorrectCount: Object.values(quizAnswers).filter((entry) => entry.correct).length,
      }}
    >
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider")
  return ctx
}
