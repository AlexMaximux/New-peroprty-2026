"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type Attribute } from "next-themes"

export function ThemeProvider({
  children,
  attribute = "class" as Attribute,
  defaultTheme = "dark",
  enableSystem = false,
  disableTransitionOnChange = true,
}: {
  children: React.ReactNode
  attribute?: Attribute
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}) {
  return <NextThemesProvider attribute={attribute} defaultTheme={defaultTheme} enableSystem={enableSystem} disableTransitionOnChange={disableTransitionOnChange}>{children}</NextThemesProvider>
}