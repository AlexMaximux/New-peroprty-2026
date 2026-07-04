import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0b0f', color: '#d4a574', gap: 16 }}>
      <h1>404 — Page not found</h1>
      <Link href="/" style={{ color: '#d4a574' }}>Go home</Link>
    </main>
  )
}
