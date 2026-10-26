import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * Hook to detect if the user prefers reduced motion.
 * Respects system accessibility preferences.
 */
export function usePrefersReducedMotion(): boolean {
  const motionReduced = useReducedMotion();
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return Boolean(motionReduced || prefersReduced);
}

export default usePrefersReducedMotion;
