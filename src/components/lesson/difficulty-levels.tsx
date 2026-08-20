import type { ReactNode } from "react"
import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface DifficultyLevelsProps {
  simple: ReactNode
  developer: ReactNode
  interview: ReactNode
}

export function DifficultyLevels({ simple, developer, interview }: DifficultyLevelsProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="not-prose">
      <Tabs defaultValue="simple">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="simple">Super simple</TabsTrigger>
          <TabsTrigger value="developer">Developer</TabsTrigger>
          <TabsTrigger value="interview">Interview</TabsTrigger>
        </TabsList>
        {(
          [
            ["simple", simple],
            ["developer", developer],
            ["interview", interview],
          ] as const
        ).map(([value, content]) => (
          <TabsContent key={value} value={value} className="mt-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={value}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="rounded-lg border bg-card p-4 text-sm text-muted-foreground [&_code]:font-mono-code [&_code]:text-foreground [&_strong]:text-foreground"
              >
                {content}
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
