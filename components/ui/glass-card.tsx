"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { forwardRef } from "react"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  children: React.ReactNode
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = true, children, ...props }, ref) => {
    const Component = hover ? motion.div : "div"
    
    return (
      <Component
        ref={ref}
        className={cn(
          "glass-card",
          className
        )}
        {...(hover && {
          whileHover: { 
            scale: 1.02,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          },
          transition: { duration: 0.2 }
        })}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

GlassCard.displayName = "GlassCard"