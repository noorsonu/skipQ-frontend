export default function manifest() {
  return {
    name: 'SkipQ | Skip The Wait. Own Your Time.',
    short_name: 'SkipQ',
    description: 'Hyperlocal Live Queue Management & Token Booking Platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#F3F1E9',
    theme_color: '#176B65',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any',
      },
    ],
  };
}
