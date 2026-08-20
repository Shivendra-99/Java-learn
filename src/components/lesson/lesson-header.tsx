import { Clock } from "lucide-react"
import type { Lesson } from "@/lib/lessons-data"
import { lessons } from "@/lib/lessons-data"

export function LessonHeader({ lesson }: { lesson: Lesson }) {
  return (
    <header className="space-y-3 border-b pb-6">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Lesson {lesson.order} of {lessons.length}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
        {lesson.title}
      </h1>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <p className="max-w-2xl">{lesson.description}</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" aria-hidden="true" />
        <span>~{lesson.minutes} min read</span>
      </div>
    </header>
  )
}
