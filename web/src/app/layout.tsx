import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ReactQueryProvider } from '@/components/providers/react-query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from 'sonner';
import './globals.css';

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
        variables: {
          colorPrimary: '#34d399', // Emerald accent
          colorBackground: '#0f172a', // Dark background
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>
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
