import type { ReactNode } from "react"
import { Lightbulb } from "lucide-react"

interface AnalogyCardProps {
  title: string
  children: ReactNode
}

export function AnalogyCard({ title, children }: AnalogyCardProps) {
  return (
    <div className="not-prose overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] to-transparent">
      <div className="flex items-start gap-3 px-5 py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Lightbulb className="size-5" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">Real-world analogy</p>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <div className="text-sm text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  )
}
