import { Fragment, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { Briefcase, ChevronDown, Search, ArrowRight, X, Lightbulb } from "lucide-react"
import { SIMPLE_ANSWERS } from "@/lib/interview-simple"
import {
  interviewQuestions,
  INTERVIEW_CATEGORIES,
  toPlainText,
  searchableText,
  type InterviewCategory,
  type InterviewQuestionEntry,
} from "@/lib/interview-questions"
import { getLessonBySlug, prefetchLesson } from "@/lib/lessons-data"
import { useSeo } from "@/hooks/use-seo"
import { SITE_URL, SITE_NAME } from "@/lib/site-config"
import { cn } from "@/lib/utils"

const DESCRIPTION =
  "Practice the Java interview questions that actually come up — equals and hashCode, HashMap internals, pass-by-value, checked exceptions, streams, and thread safety — each with a complete, honest answer."

/** Renders `code` spans in an answer string as inline <code>. */
function formatAnswer(answer: string) {
  return answer.split("`").map((part, index) =>
    index % 2 === 1 ? (
      <code key={index} className="rounded bg-muted px-1.5 py-0.5 font-mono-code text-[13px] text-foreground">
        {part}
      </code>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  )
}

const CATEGORY_KEYS = Object.keys(INTERVIEW_CATEGORIES) as InterviewCategory[]

/** The optional extras below an answer: bullets, a snippet, a comparison table. */
function AnswerExtras({ entry }: { entry: InterviewQuestionEntry }) {
  return (
    <>
      {entry.points ? (
        <ul className="mt-3 space-y-1.5">
          {entry.points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <span>{formatAnswer(point)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {entry.code ? (
        <figure className="mt-3">
          {entry.code.caption ? (
            <figcaption className="mb-1.5 text-xs text-muted-foreground">
              {entry.code.caption}
            </figcaption>
          ) : null}
          <pre className="overflow-x-auto rounded-lg border bg-[#0d1117] p-3.5 font-mono-code text-[12.5px] leading-relaxed text-gray-300">
            {entry.code.snippet}
          </pre>
        </figure>
      ) : null}

      {entry.table ? (
        <div className="mt-3 overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50">
                {entry.table.columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="border-b px-3 py-2 text-left text-xs font-semibold text-foreground"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entry.table.rows.map(([left, right]) => (
                <tr key={left} className="align-top even:bg-muted/20">
                  <td className="border-b px-3 py-2 text-muted-foreground">{formatAnswer(left)}</td>
                  <td className="border-b px-3 py-2 text-muted-foreground">{formatAnswer(right)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  )
}

export default function InterviewQuestionsPage() {
  const prefersReducedMotion = useReducedMotion()
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<InterviewCategory | "all">("all")

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      name: "Java Interview Questions",
      url: `${SITE_URL}/interview-questions`,
      mainEntity: interviewQuestions.map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: [toPlainText(entry.answer), ...(entry.points ?? []).map(toPlainText)].join(" "),
        },
      })),
    }),
    [],
  )

  useSeo({
    title: "Java Interview Questions & Answers",
    description: DESCRIPTION,
    path: "/interview-questions",
    type: "article",
    jsonLd,
  })

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return interviewQuestions.filter((entry) => {
      if (activeCategory !== "all" && entry.category !== activeCategory) return false
      if (!q) return true
      const simple = (SIMPLE_ANSWERS[entry.id] ?? "").toLowerCase()
      return searchableText(entry).includes(q) || simple.includes(q)
    })
  }, [query, activeCategory])

  const counts = useMemo(() => {
    const map = new Map<InterviewCategory, number>()
    for (const entry of interviewQuestions) {
      map.set(entry.category, (map.get(entry.category) ?? 0) + 1)
    }
    return map
  }, [])

  return (
    <div className="mx-auto max-w-3xl">
      <header className="border-b pb-6">
        <span className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase">
          <Briefcase className="size-3.5" aria-hidden="true" />
          Interview prep
        </span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
          Java Interview Questions
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          {interviewQuestions.length} questions that genuinely come up, each with the kind of
          answer that shows you understand the mechanism — not just the definition.
        </p>
      </header>

      <div className="sticky top-14 z-20 -mx-4 bg-background/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search questions and answers…"
            aria-label="Search interview questions"
            className="h-10 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            aria-pressed={activeCategory === "all"}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              activeCategory === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            All {interviewQuestions.length}
          </button>
          {CATEGORY_KEYS.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                activeCategory === category
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {INTERVIEW_CATEGORIES[category]} {counts.get(category) ?? 0}
            </button>
          ))}
        </div>
      </div>

      <p className="pb-3 text-xs text-muted-foreground" aria-live="polite">
        Showing {results.length} of {interviewQuestions.length}
      </p>

      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Nothing matches “{query}”. Try a different term, or clear the filters.
        </p>
      ) : (
        <ul className="space-y-2.5 pb-16">
          {results.map((entry, index) => {
            const lesson = entry.related ? getLessonBySlug(entry.related) : undefined
            return (
              <motion.li
                key={entry.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.22,
                  delay: prefersReducedMotion ? 0 : Math.min(index, 8) * 0.03,
                  ease: "easeOut",
                }}
              >
                <details className="group overflow-hidden rounded-xl border bg-card">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3.5 select-none">
                    <span className="flex items-start gap-3">
                      <Briefcase
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-foreground">{entry.question}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
                        {INTERVIEW_CATEGORIES[entry.category]}
                      </span>
                      <ChevronDown
                        className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </span>
                  </summary>

                  <div className="space-y-4 border-t px-4 py-3.5 sm:pl-11">
                    {SIMPLE_ANSWERS[entry.id] ? (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-3">
                        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-primary uppercase">
                          <Lightbulb className="size-3.5" aria-hidden="true" />
                          In simple words
                        </p>
                        <p className="text-sm leading-relaxed text-foreground/90">
                          {formatAnswer(SIMPLE_ANSWERS[entry.id])}
                        </p>
                      </div>
                    ) : null}

                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                        <Briefcase className="size-3.5" aria-hidden="true" />
                        Interview answer
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {formatAnswer(entry.answer)}
                      </p>
                      <AnswerExtras entry={entry} />
                    </div>

                    {lesson ? (
                      <Link
                        to={`/lessons/${lesson.slug}`}
                        onMouseEnter={() => prefetchLesson(lesson.slug)}
                        onFocus={() => prefetchLesson(lesson.slug)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        Full lesson: {lesson.shortTitle}
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    ) : null}
                  </div>
                </details>
              </motion.li>
            )
          })}
        </ul>
      )}

      <div className="border-t py-8">
        <p className="text-sm text-muted-foreground">
          Reading answers isn't the same as being able to give them. Work through the{" "}
          <Link to="/" className="font-medium text-primary underline underline-offset-4 hover:no-underline">
            {SITE_NAME} course
          </Link>{" "}
          and you'll be explaining these from understanding rather than memory.
        </p>
      </div>
    </div>
  )
}
