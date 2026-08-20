import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useLocation } from "react-router-dom"

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      key={location.pathname}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
