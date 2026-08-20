import type { ReactNode } from "react"
import { Ban, CircleCheck } from "lucide-react"

interface CommonMistakeProps {
  title: string
  wrong: string
  right: string
  explanation: ReactNode
}

export function CommonMistake({ title, wrong, right, explanation }: CommonMistakeProps) {
  return (
    <div className="not-prose overflow-hidden rounded-xl border">
      <div className="border-b bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground">
        Common mistake — {title}
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-2">
        <div className="bg-destructive/5 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-destructive">
            <Ban className="size-3.5" aria-hidden="true" />
            Don't
          </p>
          <pre className="overflow-x-auto font-mono-code text-[13px] leading-relaxed text-foreground">{wrong}</pre>
        </div>
        <div className="bg-success/5 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-success">
            <CircleCheck className="size-3.5" aria-hidden="true" />
            Do
          </p>
          <pre className="overflow-x-auto font-mono-code text-[13px] leading-relaxed text-foreground">{right}</pre>
        </div>
      </div>
      <div className="border-t px-4 py-3 text-sm text-muted-foreground [&_code]:font-mono-code [&_code]:text-foreground">
        {explanation}
      </div>
    </div>
  )
}
