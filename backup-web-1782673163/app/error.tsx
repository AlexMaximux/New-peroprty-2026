'use client'

export default function Error({ error: _error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0b0f', color: '#d4a574', gap: 16 }}>
      <h2>Something went wrong</h2>
      <button onClick={() => reset()} style={{ color: '#0a0b0f', background: '#d4a574', padding: '8px 16px', borderRadius: 8 }}>Try again</button>
    </div>
  )
}
