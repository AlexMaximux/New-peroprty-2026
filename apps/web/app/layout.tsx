import type { Metadata } from 'next';
import './globals.css';
import { NavBar } from '@/components/nav-bar';

export const metadata: Metadata = {
  title: 'PropVest — Private UK Property Investment Marketplace',
  description:
    'Private, investor-focused property marketplace connecting buyers with vetted investment opportunities across the UK.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-deep-900">
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}