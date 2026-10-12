import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Crypto Binary',
    short_name: 'Crypto Binary',
    description: 'Crypto Binary demo trading and market analysis workspace.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b1010',
    theme_color: '#0b1010',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}