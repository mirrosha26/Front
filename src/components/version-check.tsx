'use client';

import { useEffect } from 'react';

export function VersionCheck() {
  useEffect(() => {
    // Application version - increment on breaking changes
    const APP_VERSION = '2.0.0';
    const STORAGE_KEY = 'veck_app_version';

    try {
      const storedVersion = localStorage.getItem(STORAGE_KEY);

      if (storedVersion !== APP_VERSION) {
        console.log(
          `Version mismatch detected: ${storedVersion} -> ${APP_VERSION}`
        );

        // Clear all cached data
        localStorage.clear();
        sessionStorage.clear();

        // Save new version
        localStorage.setItem(STORAGE_KEY, APP_VERSION);

        // Force reload without cache
        window.location.reload();
      }
    } catch (error) {
      console.error('Version check error:', error);
    }
  }, []);

  return null;
}
