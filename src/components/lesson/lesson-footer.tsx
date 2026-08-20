import { Link } from "react-router-dom"
import { CheckCircle2, Circle, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAdjacentLessons, prefetchLesson } from "@/lib/lessons-data"
import { useProgress } from "@/context/progress-context"
import { cn } from "@/lib/utils"

export function LessonFooter({ slug }: { slug: string }) {
  const { previous, next } = getAdjacentLessons(slug)
  const { isComplete, toggleComplete } = useProgress()
  const complete = isComplete(slug)

  return (
    <footer className="mt-12 space-y-6 border-t pt-6">
      <Button
        type="button"
        variant={complete ? "secondary" : "default"}
        onClick={() => toggleComplete(slug)}
        className={cn("gap-2", complete && "text-success")}
      >
        {complete ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <Circle className="size-4" aria-hidden="true" />}
        {complete ? "Marked as complete" : "Mark as complete"}
      </Button>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {previous ? (
          <Link
            to={`/lessons/${previous.slug}`}
            onMouseEnter={() => prefetchLesson(previous.slug)}
            onFocus={() => prefetchLesson(previous.slug)}
            className="group flex flex-col rounded-lg border p-4 text-sm transition-colors hover:border-primary/50 hover:bg-accent/40"
          >
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Previous
            </span>
            <span className="mt-1 font-medium text-foreground group-hover:text-primary">{previous.shortTitle}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/lessons/${next.slug}`}
            onMouseEnter={() => prefetchLesson(next.slug)}
            onFocus={() => prefetchLesson(next.slug)}
            className="group flex flex-col items-end rounded-lg border p-4 text-right text-sm transition-colors hover:border-primary/50 hover:bg-accent/40"
          >
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Next
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </span>
            <span className="mt-1 font-medium text-foreground group-hover:text-primary">{next.shortTitle}</span>
          </Link>
        ) : (
          <Link
            to="/"
            className="group flex flex-col items-end rounded-lg border border-success/40 bg-success/10 p-4 text-right text-sm transition-colors hover:bg-success/20"
          >
            <span className="flex items-center gap-1.5 text-xs text-success">
              You're done!
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </span>
            <span className="mt-1 font-medium text-foreground">Back to overview</span>
          </Link>
        )}
      </div>
    </footer>
  )
}
