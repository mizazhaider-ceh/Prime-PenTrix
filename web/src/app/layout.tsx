import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ReactQueryProvider } from '@/components/providers/react-query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from 'sonner';
import './globals.css';

// Force dynamic rendering for entire app to prevent Clerk validation errors during static generation in CI
export const dynamic = 'force-dynamic';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Prime PenTrix',
  description:
    'Where Penetration Testing Meets Intelligence - Advanced AI platform for CS Engineering students at Howest University Belgium',
  keywords: [
    'AI tutor',
    'cybersecurity',
    'computer science',
    'study platform',
    'RAG',
    'education',
    'penetration testing',
    'pentesting',
  ],
  authors: [{ name: 'Muhammad Izaz Haider (MIHx0)', url: 'https://github.com/MIHx0' }],
  creator: 'MIHx0',
  openGraph: {
    type: 'website',
    title: 'Prime PenTrix',
    description: 'Where Penetration Testing Meets Intelligence',
    siteName: 'Prime PenTrix',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        layout: {
          socialButtonsPlacement: 'bottom',
          socialButtonsVariant: 'iconButton',
        },
        variables: {
          colorPrimary: '#10b981',
          colorBackground: '#1e293b',
          colorText: '#f1f5f9',
          colorTextOnPrimaryBackground: '#ffffff',
          colorTextSecondary: '#94a3b8',
          colorInputBackground: '#334155',
          colorInputText: '#f1f5f9',
          colorShimmer: '#475569',
          colorNeutral: '#cbd5e1',
          colorDanger: '#ef4444',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          borderRadius: '0.5rem',
          fontFamily: 'var(--font-inter)',
        },
      }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Inline script to restore theme BEFORE paint — prevents white flash on refresh */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('prime-pentrix-theme');if(t)document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme='dark'}catch(e){}})()`,
            }}
          />
        </head>
        <body className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen`}>
          <ThemeProvider>
            <ReactQueryProvider>
              {children}
              <Toaster position="top-right" richColors />
            </ReactQueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
