"use client"

import { useAppStore } from "@/lib/store"
import { useEffect } from "react"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, accentColor } = useAppStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-accent', accentColor)
  }, [theme, accentColor])

  return <>{children}</>
}