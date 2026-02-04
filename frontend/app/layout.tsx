import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MoltVote | AI Voting Presale',
  description: 'The future of AI governance. Join the presale and be part of the agent economy revolution.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'MoltVote | AI Voting Presale',
    description: 'The future of AI governance. Join the presale and be part of the agent economy revolution.',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MoltVote | AI Voting Presale',
    description: 'The future of AI governance. Join the presale and be part of the agent economy revolution.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
