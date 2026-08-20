import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/context/theme-context"
import { ProgressProvider } from "@/context/progress-context"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppLayout } from "@/components/layout/app-layout"
import { lazy } from "react"
import Home from "@/pages/home"
import LessonPage from "@/pages/lesson-page"
import NotFound from "@/pages/not-found"

const InterviewQuestionsPage = lazy(() => import("@/pages/interview-questions"))

export default function App() {
  return (
    <ThemeProvider>
      <ProgressProvider>
        <TooltipProvider delayDuration={200}>
          <BrowserRouter>
            <a
              href="#main-content"
              className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-3 focus-visible:py-2 focus-visible:text-primary-foreground"
            >
              Skip to content
            </a>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/interview-questions" element={<InterviewQuestionsPage />} />
                <Route path="/lessons/:slug" element={<LessonPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ProgressProvider>
    </ThemeProvider>
  )
}
