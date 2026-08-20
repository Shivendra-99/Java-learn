import { useMemo } from "react"
import { Link } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, CheckCircle2, Sparkles, Eye, Boxes, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { lessons, getLessonsBySection, prefetchLesson } from "@/lib/lessons-data"
import { useProgress } from "@/context/progress-context"
import { CompilePipeline } from "@/components/diagram/compile-pipeline"
import { useSeo } from "@/hooks/use-seo"
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION } from "@/lib/site-config"

const PILLARS = [
  {
    icon: Sparkles,
    label: "Plain English first",
    detail: "Every keyword is explained before you're asked to type it — no cargo-culting public static void main.",
  },
  {
    icon: Eye,
    label: "See the memory",
    detail: "Step through the stack and heap to watch references, mutation, and garbage collection happen.",
  },
  {
    icon: Boxes,
    label: "Predict the output",
    detail: "The snippets that catch people out in interviews, with you committing to an answer before the reveal.",
  },
]

export default function Home() {
  const { isComplete, completedCount, totalCount } = useProgress()
  const prefersReducedMotion = useReducedMotion()
  const firstIncomplete = lessons.find((lesson) => !isComplete(lesson.slug)) ?? lessons[0]
  const hasStarted = completedCount > 0
  const percent = Math.round((completedCount / totalCount) * 100)

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Course",
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      provider: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
      isAccessibleForFree: true,
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: "PT10H",
      },
      about: "Java programming language",
      educationalLevel: "Beginner",
      hasPart: lessons.map((lesson) => ({
        "@type": "LearningResource",
        name: lesson.title,
        description: lesson.description,
        url: `${SITE_URL}/lessons/${lesson.slug}`,
        position: lesson.order,
      })),
    }),
    [],
  )

  useSeo({
    title: "Learn Java Free — Interactive Core Java Tutorials",
    description: DEFAULT_DESCRIPTION,
    path: "/",
    jsonLd,
  })

  return (
    <div className="mx-auto max-w-5xl">
      <section className="grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
        <div className="flex flex-col items-start gap-5">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            A free, hands-on Core Java course
          </span>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
            Learn Java properly, not just enough to compile.
          </h1>
          <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
            {lessons.length} lessons from your first <code className="font-mono-code text-foreground">main</code> method
            to generics, streams, and threads — with the stack and heap drawn out so the tricky parts stop being
            mysterious.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button asChild size="lg" className="gap-2">
              <Link to={`/lessons/${firstIncomplete.slug}`}>
                {hasStarted ? "Continue learning" : "Start learning"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/interview-questions">
                <Briefcase className="size-4" aria-hidden="true" />
                Interview questions
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="#course-outline">Explore the curriculum</Link>
            </Button>
          </div>

          <div className="w-full max-w-xs pt-2">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Your progress</span>
              <span>
                {completedCount}/{totalCount} lessons
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <CompilePipeline />
      </section>

      <section className="grid gap-4 border-y py-8 sm:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div key={pillar.label} className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <pillar.icon className="size-4.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{pillar.label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{pillar.detail}</p>
            </div>
          </div>
        ))}
      </section>

      <section id="course-outline" className="scroll-mt-20 py-16">
        <h2 className="mb-5 text-lg font-semibold text-foreground">Course outline</h2>
        <div className="space-y-10">
          {getLessonsBySection().map((group) => (
            <div key={group.section}>
              <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{group.label}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.lessons.map((lesson, index) => {
                  const Icon = lesson.icon
                  const complete = isComplete(lesson.slug)
                  return (
                    <motion.div
                      key={lesson.slug}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: prefersReducedMotion ? 0 : index * 0.04, ease: "easeOut" }}
                    >
                      <Link
                        to={`/lessons/${lesson.slug}`}
                        onMouseEnter={() => prefetchLesson(lesson.slug)}
                        onFocus={() => prefetchLesson(lesson.slug)}
                        className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="size-4.5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground group-hover:text-primary">
                              {lesson.order}. {lesson.title}
                            </span>
                            {complete ? (
                              <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">{lesson.description}</span>
                        </span>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
