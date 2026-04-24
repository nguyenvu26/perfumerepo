import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fragrance Journal | PerfumeGPT',
  description: 'Read the latest stories, guides, and insights into the world of luxury fragrances. Discover the art and science of perfumery.',
  openGraph: {
    title: 'Fragrance Journal | PerfumeGPT',
    description: 'Read the latest stories, guides, and insights into the world of luxury fragrances. Discover the art and science of perfumery.',
    type: 'website',
  },
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
