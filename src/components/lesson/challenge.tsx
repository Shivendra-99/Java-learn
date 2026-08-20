import type { ReactNode } from "react"
import { ChevronDown, FlaskConical } from "lucide-react"

interface ChallengeProps {
  title?: string
  children: ReactNode
  hint?: ReactNode
}

export function Challenge({ title = "Try it yourself", children, hint }: ChallengeProps) {
  return (
    <div className="not-prose overflow-hidden rounded-lg border border-accent bg-accent/40 dark:bg-accent/20">
      <div className="flex items-start gap-3 px-4 py-3">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="space-y-1.5 text-sm">
          <p className="font-semibold text-foreground">{title}</p>
          <div className="text-muted-foreground">{children}</div>
        </div>
      </div>
      {hint ? (
        <details className="group border-t border-accent/80 px-4 py-2.5 text-sm">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium text-primary select-none">
            <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
            Need a hint?
          </summary>
          <div className="mt-2 pl-5 text-muted-foreground [&_code]:font-mono-code [&_code]:text-foreground">{hint}</div>
        </details>
      ) : null}
    </div>
  )
}
