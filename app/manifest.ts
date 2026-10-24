import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Crypto Binary',
    short_name: 'Crypto Binary',
    description: 'Unlock a one-time $20 withdrawable, tradable welcome bonus with your first deposit of at least $5.',
    id: '/',
    scope: '/',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b1010',
    theme_color: '#0b1010',
    icons: [
      {
        src: '/pwa-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}