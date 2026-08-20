import { Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useSeo } from "@/hooks/use-seo"

/**
 * Rendered both by the catch-all "*" route and by the lesson route when the
 * slug doesn't match a lesson. Both paths set the same noindex SEO, so it
 * doesn't matter which effect runs last when they're nested.
 */
export default function NotFound() {
  const { pathname } = useLocation()

  useSeo({
    title: "Page not found",
    description: "That page doesn't exist. Head back to the course overview.",
    path: pathname,
    noindex: true,
  })

  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-4 py-20">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
      <p className="text-muted-foreground">
        We couldn't find <code className="font-mono-code text-foreground">{pathname}</code>. It may
        have moved, or the link might be wrong.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/">Back to overview</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/interview-questions">Interview questions</Link>
        </Button>
      </div>
    </div>
  )
}
