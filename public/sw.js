import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Injected at deploy time with the git SHA — forces all PWA clients to
// install the new SW immediately and clear stale caches.
const CACHE_VERSION = '__CACHE_VERSION__'

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => !k.includes(CACHE_VERSION) && k.startsWith('workbox-'))
          .map(k => caches.delete(k))
      )
    )
  )
})

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({ cacheName: 'google-fonts-cache', plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536000 })] })
)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({ cacheName: 'gstatic-fonts-cache', plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536000 })] })
)
