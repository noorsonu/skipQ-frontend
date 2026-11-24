export default function manifest() {
  return {
    name: 'SkipQ | Skip The Wait. Own Your Time.',
    short_name: 'SkipQ',
    description: 'Hyperlocal Live Queue Management & Token Booking Platform',
    id: '/',
    start_url: '/',
    scope: '/',
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
    shortcuts: [
      {
        name: 'SkipQ Partner App',
        short_name: 'Partner Console',
        description: 'Manage store queue, counters and live token calling',
        url: '/merchant/register?tab=login',
        icons: [{ src: '/icon-merchant-192.png', sizes: '192x192' }],
      },
      {
        name: 'Customer Live Tokens',
        short_name: 'My Tokens',
        description: 'View active queue passes & waiting radar',
        url: '/tokens',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
