import type { ReactNode } from "react"
import { ChevronDown, Briefcase } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface InterviewQuestionProps {
  question: string
  answer: ReactNode
}

export function InterviewQuestion({ question, answer }: InterviewQuestionProps) {
  return (
    <details className="group not-prose overflow-hidden rounded-xl border">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3 select-none">
        <span className="flex items-start gap-2.5 text-sm font-medium text-foreground">
          <Briefcase className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          {question}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary" className="hidden text-[10px] sm:inline-flex">
            Interview
          </Badge>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
        </span>
      </summary>
      <div className="border-t px-4 py-3 text-sm text-muted-foreground [&_code]:font-mono-code [&_code]:text-foreground [&_strong]:text-foreground">
        {answer}
      </div>
    </details>
  )
}
