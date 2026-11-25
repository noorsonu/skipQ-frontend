/**
 * Unified Storage & Cache Purge Utility for SkipQ
 * Guarantees that any user opening the app has all stale/mock/demo local storage
 * and credentials completely wiped when a platform reset occurs.
 */

export const CURRENT_PLATFORM_EPOCH = 'ak_fresh_platform_epoch_2026_11_25_clean_v1';

export function enforceCleanSlate() {
  if (typeof window === 'undefined') return false;

  try {
    const isClean = localStorage.getItem(CURRENT_PLATFORM_EPOCH);
    if (!isClean) {
      console.log('🔄 Enforcing fresh platform clean slate. Purging stale local data...');
      
      // Wipe all ak_ keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('ak_') || key.startsWith('skipq_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // Clear session storage
      try {
        sessionStorage.clear();
      } catch (e) {}

      // Clear CacheStorage (ServiceWorker / Next.js caches)
      if (typeof window.caches !== 'undefined') {
        window.caches.keys().then(keys => {
          keys.forEach(k => window.caches.delete(k));
        }).catch(() => {});
      }

      // Mark fresh epoch as active
      localStorage.setItem(CURRENT_PLATFORM_EPOCH, 'true');
      return true;
    }
  } catch (err) {
    console.error('Error enforcing clean slate:', err);
  }

  return false;
}
