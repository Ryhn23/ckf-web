import { useEffect, useRef, useState } from 'react';

/**
 * Animasi angka naik (count-up) saat elemen masuk viewport.
 * @returns {ref, value} ref dipasang ke elemen target, value = angka animasi
 */
export default function useCountUp(target = 0, duration = 1600) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || startedRef.current) return;
        startedRef.current = true;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          // easeOutCubic
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(Math.round(eased * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return [ref, value];
}
