import type { Metadata } from "next"
import "./globals.css"
import { SidebarProvider } from "@/components/layout/sidebar-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"

export const metadata: Metadata = {
  title: "PropVest — Private UK Property Investment Marketplace",
  description:
    "Private, investor-focused property marketplace connecting buyers with vetted investment opportunities across the UK.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Inter:wght@300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--bg-primary)] font-ui antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}