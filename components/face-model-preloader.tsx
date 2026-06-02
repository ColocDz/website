'use client';

import { useEffect } from 'react';
import { ensureModelsLoaded } from '@/lib/face-models';

export function FaceModelPreloader() {
  useEffect(() => {
    // Start preloading the models in the background on mount
    ensureModelsLoaded().catch((err) => {
      console.warn('Face models preload failed, will retry on demand:', err);
    });

    // Ping API routes in the background to warm up Vercel serverless functions
    fetch('/api/posts?ping=true').catch(() => {});
    fetch('/api/user').catch(() => {});
  }, []);

  return null;
}
