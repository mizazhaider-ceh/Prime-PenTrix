import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — Prime PenTrix',
  description:
    'Learn about Prime PenTrix (Sentinel V3) — the AI-powered study platform for CS Engineering at Howest University Belgium.',
};

export default function InfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
