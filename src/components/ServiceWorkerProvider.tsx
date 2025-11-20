'use client';

import { useEffect } from 'react';

export default function ServiceWorkerProvider() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    // Skip service worker in dev mode to avoid caching issues
    if (process.env.NODE_ENV === 'development') {
      // Unregister any existing service workers to clear dev cache
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.info('SW registered', registration);
      } catch (error) {
        console.error('SW registration failed', error);
      }
    };

    register();
  }, []);

  return null;
}

