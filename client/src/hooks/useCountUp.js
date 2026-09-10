import { useEffect, useRef, useState } from 'react';

/**
 * Animasi angka naik (count-up) saat elemen masuk viewport atau saat nilai target berubah.
 * @returns [ref, value] ref dipasang ke elemen target, value = angka animasi
 */
export default function useCountUp(target = 0, duration = 1600) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const hasAnimatedRef = useRef(false);
  const prevTargetRef = useRef(target);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let animId = null;

    const startAnimation = (fromVal, toVal) => {
      const startTime = performance.now();
      const tick = (now) => {
        const p = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(fromVal + (toVal - fromVal) * eased));
        if (p < 1) {
          animId = requestAnimationFrame(tick);
        }
      };
      animId = requestAnimationFrame(tick);
    };

    // Jika target berubah setelah sebelumnya sudah ter-render/ter-animasi
    if (hasAnimatedRef.current && prevTargetRef.current !== target) {
      const currentVal = prevTargetRef.current;
      prevTargetRef.current = target;
      startAnimation(currentVal, target);
      return () => {
        if (animId) cancelAnimationFrame(animId);
      };
    }

    prevTargetRef.current = target;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || hasAnimatedRef.current) return;
        hasAnimatedRef.current = true;
        startAnimation(0, target);
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (animId) cancelAnimationFrame(animId);
    };
  }, [target, duration]);

  return [ref, value];
}
