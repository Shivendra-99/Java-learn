import type { ReactNode } from "react"
import { Info, Lightbulb, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"

type CalloutVariant = "info" | "tip" | "warning"

const VARIANT_STYLES: Record<CalloutVariant, { icon: typeof Info; classes: string; label: string }> = {
  info: {
    icon: Info,
    classes: "border-primary/30 bg-primary/5 text-foreground [&_svg]:text-primary",
    label: "Note",
  },
  tip: {
    icon: Lightbulb,
    classes: "border-success/30 bg-success/10 text-foreground [&_svg]:text-success",
    label: "Tip",
  },
  warning: {
    icon: TriangleAlert,
    classes: "border-destructive/30 bg-destructive/5 text-foreground [&_svg]:text-destructive",
    label: "Watch out",
  },
}

interface CalloutProps {
  variant?: CalloutVariant
  title?: string
  children: ReactNode
}

export function Callout({ variant = "info", title, children }: CalloutProps) {
  const { icon: Icon, classes, label } = VARIANT_STYLES[variant]

  return (
    <div role="note" className={cn("not-prose flex gap-3 rounded-lg border px-4 py-3 text-sm", classes)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-semibold">{title ?? label}</p>
        <div className="text-muted-foreground [&_code]:font-mono-code [&_code]:text-foreground">{children}</div>
      </div>
    </div>
  )
}
