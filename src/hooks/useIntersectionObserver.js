// useIntersectionObserver.js — reusable IntersectionObserver hook for infinite scroll & video autoplay
import { useEffect, useRef, useState } from 'react';

/**
 * Returns [ref, isIntersecting]
 * Attach `ref` to the element you want to observe.
 */
export function useIntersectionObserver(options = {}) {
  const ref = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return [ref, isIntersecting];
}

/**
 * Infinite scroll hook — calls `onLoadMore` when sentinel enters viewport
 */
export function useInfiniteScroll(onLoadMore, { enabled = true } = {}) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0, rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, enabled]);

  return sentinelRef;
}
