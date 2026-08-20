import { Suspense } from "react"
import { Outlet } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Topbar } from "@/components/layout/topbar"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { PageTransition } from "@/components/layout/page-transition"

function LessonFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
    </div>
  )
}

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Topbar />
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-64 shrink-0 border-r md:block">
          <SidebarNav />
        </aside>
        <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
          <Suspense fallback={<LessonFallback />}>
            <PageTransition>
              <Outlet />
            </PageTransition>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
