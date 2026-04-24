import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fragrance Collection | PerfumeGPT',
  description: 'Explore our curated collection of luxury fragrances. Filter by brand, scent family, gender, and price to find your perfect match.',
  openGraph: {
    title: 'Fragrance Collection | PerfumeGPT',
    description: 'Explore our curated collection of luxury fragrances. Filter by brand, scent family, gender, and price to find your perfect match.',
    type: 'website',
  },
};

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
