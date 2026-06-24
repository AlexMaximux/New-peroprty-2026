'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-deep-800/50 via-transparent to-deep-900" />
        <div className="absolute top-1/4 left-1/3 h-96 w-96 rounded-full bg-gold-500/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-emerald-500/5 blur-[100px]" />

        <div className="page-container relative z-10 flex min-h-[70vh] flex-col items-center justify-center text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/5 px-4 py-1.5 text-xs font-medium text-gold-400">
            <span className="status-dot status-dot-yellow" />
            Private Investor Marketplace
          </span>

          <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Discover{' '}
            <span className="gradient-text">Vetted Property</span>
            {' '}Investments
          </h1>

          <p className="mt-6 max-w-xl text-lg text-slate-300">
            UK&apos;s exclusive marketplace connecting serious investors with
            hand-picked agency opportunities — HMOs, serviced accommodation,
            development sites, and more.
          </p>

          <div className="mt-10 flex gap-4">
            <Link href="/register" className="btn-primary text-base !px-8 !py-3">
              Get Started
            </Link>
            <Link href="/login" className="btn-secondary text-base !px-8 !py-3">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="page-container">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Verified Agencies', value: '50+' },
            { label: 'Active Deals', value: '200+' },
            { label: 'Avg. ROI', value: '12.5%' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card glass-card-hover p-6 text-center">
              <p className="text-3xl font-bold gradient-text">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="page-container pb-20">
        <div className="glass-card relative overflow-hidden p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold">For Agencies & Investors</h2>
            <p className="mt-3 text-slate-300">
              List your deals in minutes. Browse vetted opportunities. All in one platform.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link href="/register" className="btn-primary text-base !px-8 !py-3">
                Join PropVest
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}