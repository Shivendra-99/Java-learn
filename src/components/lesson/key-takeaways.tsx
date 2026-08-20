import { CheckCircle2 } from "lucide-react"

export function KeyTakeaways({ items }: { items: string[] }) {
  return (
    <div className="not-prose rounded-xl border border-success/25 bg-success/5 p-5">
      <p className="mb-3 text-sm font-semibold text-foreground">Key takeaways</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
