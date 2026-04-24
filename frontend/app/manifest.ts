import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PerfumeGPT | Luxury Fragrance & AI Consultant',
    short_name: 'PerfumeGPT',
    description: 'Find your perfect signature scent with our AI Scent Consultant.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#D4AF37', // Gold color
    icons: [
      {
        src: '/logo-dark.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
