import { useMemo } from "react"
import { useParams } from "react-router-dom"
import { getLessonBySlug, SECTIONS } from "@/lib/lessons-data"
import { LessonHeader } from "@/components/lesson/lesson-header"
import { LessonFooter } from "@/components/lesson/lesson-footer"
import { useSeo } from "@/hooks/use-seo"
import NotFound from "@/pages/not-found"
import { SITE_URL, SITE_NAME } from "@/lib/site-config"

export default function LessonPage() {
  const { slug } = useParams<{ slug: string }>()
  const lesson = getLessonBySlug(slug)

  const jsonLd = useMemo(() => {
    if (!lesson) return undefined
    return [
      {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: lesson.title,
        description: lesson.description,
        url: `${SITE_URL}/lessons/${lesson.slug}`,
        educationalLevel: "Beginner",
        learningResourceType: "Lesson",
        isPartOf: {
          "@type": "Course",
          name: SITE_NAME,
          url: SITE_URL,
        },
        timeRequired: `PT${lesson.minutes}M`,
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: SECTIONS[lesson.section], item: `${SITE_URL}/#course-outline` },
          { "@type": "ListItem", position: 3, name: lesson.title, item: `${SITE_URL}/lessons/${lesson.slug}` },
        ],
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.slug])

  useSeo({
    title: lesson ? lesson.title : "Page not found",
    description: lesson ? lesson.description : "That page doesn't exist. Head back to the course overview.",
    // Stay on the requested URL rather than pointing the canonical at "/"
    path: lesson ? `/lessons/${lesson.slug}` : `/lessons/${slug ?? ""}`,
    type: "article",
    jsonLd,
    noindex: !lesson,
  })

  // Render the 404 in place instead of redirecting home. A redirect returns 200
  // from a URL that doesn't exist, which reads as a soft 404 to crawlers, and it
  // also hides the mistyped URL from the person who followed the broken link.
  if (!lesson) {
    return <NotFound />
  }

  const LessonContent = lesson.component

  return (
    <article className="mx-auto max-w-3xl">
      <LessonHeader lesson={lesson} />
      <div className="lesson-prose mt-8">
        <LessonContent />
      </div>
      <LessonFooter slug={lesson.slug} />
    </article>
  )
}
